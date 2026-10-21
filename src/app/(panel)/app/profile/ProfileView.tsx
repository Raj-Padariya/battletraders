"use client";

// Profile & KYC — port of the old profile.js.
// Owns localStorage "bt-kyc"; merges keys into "bt-profile" without dropping existing ones (then reloadProfile() so the
// top bar updates). Sandbox: phone codes, social links, uploads and password changes are simulated; KYC uploads keep
// only the file name.
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Icon, { Svg } from "@panel/components/Icon";
import PanelShell from "@panel/components/PanelShell";
import { usePanel } from "@panel/lib/panel";
import { PROFILE_KEY, pad2, readJSON, writeJSON } from "@panel/lib/storage";

const KYC_KEY = "bt-kyc";

const UPLOAD = '<path d="M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3"/>';
const FILE = '<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5"/>';
const DISCORD = '<path d="M8.5 6.5c2.3-.7 4.7-.7 7 0M8 17.5c2.6 1 5.4 1 8 0"/><path d="M8.5 6.5 6.5 6C5 8.5 4 11.5 4 15.5c1.4 1.4 3 2.2 4.8 2.6l1-1.9M15.5 6.5l2-.5c1.5 2.5 2.5 5.5 2.5 9.5-1.4 1.4-3 2.2-4.8 2.6l-1-1.9"/><circle cx="9.5" cy="12.5" r="1.2"/><circle cx="14.5" cy="12.5" r="1.2"/>';
const TELEGRAM = '<path d="M21 4 3 11.2l6 2.1L11.3 20l3.2-4 4.8 3.6z"/><path d="m9 13.3 8.5-6.6"/>';

/* ---------- stored profile ---------- */
interface StoredProfile {
  avatar?: string;
  frame?: string;
  email?: string;
  phone?: string;
  phoneCountry?: string;
  phoneVerified?: boolean;
  country?: string;
  timezone?: string;
  gender?: string;
  fullName?: string;
  discord?: string;
  telegram?: string;
  [key: string]: unknown;
}

const readProfile = (): StoredProfile => {
  const value = readJSON<unknown>(PROFILE_KEY, {});
  return value && typeof value === "object" ? (value as StoredProfile) : {};
};

/** Merge into bt-profile, keeping every key signup (or other pages) already wrote. `undefined` deletes a key. */
const saveProfile = (patch: Partial<StoredProfile>): StoredProfile => {
  const next = readProfile();
  Object.keys(patch).forEach((key) => {
    if (patch[key] === undefined) delete next[key];
    else next[key] = patch[key];
  });
  writeJSON(PROFILE_KEY, next);
  return next;
};

/* ---------- KYC ---------- */
type KycStatus = "none" | "draft" | "pending" | "verified" | "rejected";
interface Kyc {
  status: KycStatus;
  fullName?: string;
  dob?: string;
  country?: string;
  idType?: string;
  idNumber?: string;
  address?: string;
  idFile?: string;
  addressFile?: string;
  submittedAt?: string | null;
  reviewNote?: string;
}

const STATUS: Record<KycStatus, { chip: string; cls: string; text: string }> = {
  none: { chip: "Not started", cls: "is-none", text: "Fill in the form and upload your documents. You can save progress and come back any time." },
  draft: { chip: "Draft", cls: "is-warn", text: "Your progress is saved. Finish the form and press Submit KYC to send it for review." },
  pending: { chip: "Under review", cls: "is-pend", text: "Our compliance team is checking your documents. This usually takes up to 24 hours. Cash-outs unlock once you're verified." },
  verified: { chip: "Verified", cls: "is-ok", text: "Identity verified. Cash-outs are unlocked in your wallet. Contact support if your details change." },
  rejected: { chip: "Needs changes", cls: "is-warn", text: "Our compliance team couldn't verify your documents. Fix the details below and submit again." },
};
const STEPS: [step: KycStatus, title: string, sub: string][] = [
  ["none", "Not started", "Fill in your details"],
  ["draft", "Draft", "Progress saved"],
  ["pending", "Under review", "Our team checks your documents"],
  ["verified", "Verified", "Cash-outs unlocked"],
];

const readKyc = (): Kyc => {
  const value = readJSON<Kyc | null>(KYC_KEY, null);
  return value && typeof value === "object" && value.status in STATUS ? value : { status: "none" };
};

/* ---------- phone ---------- */
const DIALS: [iso: string, dial: string][] = [
  ["IN", "+91"], ["US", "+1"], ["GB", "+44"], ["CA", "+1"], ["AU", "+61"], ["AE", "+971"], ["SA", "+966"],
  ["SG", "+65"], ["MY", "+60"], ["ID", "+62"], ["PH", "+63"], ["PK", "+92"], ["BD", "+880"], ["NG", "+234"],
  ["KE", "+254"], ["ZA", "+27"], ["DE", "+49"], ["FR", "+33"], ["ES", "+34"], ["IT", "+39"], ["BR", "+55"], ["JP", "+81"],
];
const dialFor = (iso: string | undefined): string => DIALS.find((d) => d[0] === iso)?.[1] || "";
const digits = (s: string): string => String(s || "").replace(/\D/g, "");

/* ---------- socials ---------- */
type NetKey = "discord" | "telegram";
const NETS: Record<NetKey, { name: string; pattern: RegExp; rule: string; icon: string }> = {
  discord: { name: "Discord", pattern: /^[a-z0-9_.]{2,32}$/, rule: "2 to 32 characters: lowercase letters, numbers, _ or .", icon: DISCORD },
  telegram: { name: "Telegram", pattern: /^[A-Za-z0-9_]{5,32}$/, rule: "5 to 32 characters: letters, numbers or _", icon: TELEGRAM },
};

/* ---------- avatar frames ---------- */
const FRAMES: [key: string, label: string][] = [
  ["none", "Classic"], ["neon", "Neon violet"], ["ice", "Cyan ice"], ["gold", "Champion gold"], ["hex", "Hex arena"], ["flame", "Inferno"],
];

/* ---------- timezone + countries (need Intl; built after mount) ---------- */
const detectTimezone = (): string => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
};

const offsetOf = (zone: string): { label: string; minutes: number } => {
  try {
    const options = { timeZone: zone, timeZoneName: "shortOffset" } as Intl.DateTimeFormatOptions;
    const part = new Intl.DateTimeFormat("en-US", options).formatToParts(new Date()).find((p) => p.type === "timeZoneName");
    const m = /GMT([+-])(\d{1,2})(?::(\d{2}))?/.exec(part ? part.value : "");
    if (!m) return { label: "UTC+00:00", minutes: 0 };
    const mins = (Number(m[2]) * 60 + Number(m[3] || 0)) * (m[1] === "-" ? -1 : 1);
    return { label: "UTC" + m[1] + pad2(Number(m[2])) + ":" + (m[3] || "00"), minutes: mins };
  } catch {
    return { label: "UTC", minutes: 0 };
  }
};

const buildZones = (detected: string, saved: string | undefined): { zone: string; label: string }[] => {
  let zones: string[] = [detected, "UTC"];
  try {
    const supported = (Intl as unknown as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf;
    if (supported) zones = supported("timeZone").slice();
  } catch {
    /* old browser */
  }
  [detected, saved, "UTC"].forEach((z) => {
    if (z && !zones.includes(z)) zones.push(z);
  });
  return zones
    .map((zone) => ({ zone, ...offsetOf(zone) }))
    .sort((a, b) => a.minutes - b.minutes || a.zone.localeCompare(b.zone))
    .map((z) => ({ zone: z.zone, label: "(" + z.label + ") " + z.zone.replace(/_/g, " ") }));
};

/** All two-letter regions Intl.DisplayNames can name, minus groupings and placeholders. */
const buildCountries = (fallback: [string, string] | null): [string, string][] => {
  let names: Intl.DisplayNames | null = null;
  try {
    names = new Intl.DisplayNames(["en"], { type: "region", fallback: "none" });
  } catch {
    names = null;
  }
  const skip = ["AA", "AC", "CP", "CQ", "DG", "EA", "EU", "EZ", "IC", "QO", "TA", "UN", "XA", "XB", "ZZ"];
  const list: [string, string][] = [];
  if (names) {
    for (let a = 65; a <= 90; a++) {
      for (let b = 65; b <= 90; b++) {
        const code = String.fromCharCode(a) + String.fromCharCode(b);
        if (skip.includes(code) || (/^(Q[M-Z]|X[A-Z])$/.test(code) && code !== "XK")) continue;
        let label: string | undefined;
        try {
          label = names.of(code);
        } catch {
          label = undefined;
        }
        if (label && label !== code) list.push([code, label]);
      }
    }
  }
  if (!list.length && fallback) list.push(fallback);
  return list.sort((x, y) => x[1].localeCompare(y[1]));
};

const adultCutoff = (): Date => {
  const now = new Date();
  return new Date(now.getFullYear() - 18, now.getMonth(), now.getDate());
};
const isoDate = (d: Date): string => d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());

/* ---------- small pieces ---------- */
type Errors = Record<string, string>;

function Err({ id, errors }: { id: string; errors: Errors }) {
  return <p className="st-err" id={id} hidden={!errors[id]}>{errors[id] || ""}</p>;
}

function Avatar({ cls, frame, avatar, initials, preview }: { cls: string; frame: string; avatar: string; initials: string; preview?: boolean }) {
  const marker = preview ? { "data-st-preview": "" } : { "data-st-av": "" };
  return (
    <span className={"st-av " + cls} {...marker} data-frame={frame}>
      <span className="st-av-in">
        <span className="st-av-txt" hidden={!!avatar}>{initials}</span>
        {/* eslint-disable-next-line @next/next/no-img-element -- a local data: URL, next/image adds nothing here */}
        <img alt="" src={avatar || undefined} hidden={!avatar} />
      </span>
    </span>
  );
}

function PwField({ id, label, auto, value, shown, errors, onChange, onToggle }: {
  id: string; label: string; auto: string; value: string; shown: boolean; errors: Errors;
  onChange: (value: string) => void; onToggle: () => void;
}) {
  return (
    <div className="st-field">
      <label htmlFor={id}>{label}</label>
      <div className="st-pw">
        <input
          className="st-input"
          id={id}
          type={shown ? "text" : "password"}
          autoComplete={auto}
          aria-describedby={id + "-err"}
          aria-invalid={errors[id + "-err"] ? "true" : undefined}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button className="st-eye" type="button" data-st-toggle={id} aria-label={(shown ? "Hide " : "Show ") + label.toLowerCase()} aria-pressed={shown} onClick={onToggle}>
          <Icon name="eye" />
        </button>
      </div>
      <Err id={id + "-err"} errors={errors} />
    </div>
  );
}

type DocKey = "idfile" | "addrfile";
const DOC_TYPES = /^(image\/|application\/pdf$)/;
const DOC_MAX = 10 * 1024 * 1024;

function DocUpload({ docKey, label, hint, name, errors, onPick, onRemove }: {
  docKey: DocKey; label: string; hint: string; name: string; errors: Errors;
  onPick: (file: File) => void; onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const errId = "st-" + docKey + "-err";
  return (
    <div className="st-field st-doc" data-st-doc={docKey}>
      <span className="st-lbl" id={"st-" + docKey + "-lbl"}>{label}</span>
      <div className={"st-doc-box" + (name ? " has-file" : "") + (errors[errId] ? " is-invalid" : "")}>
        <span className="st-doc-ico"><Svg body={FILE} /></span>
        <span className="st-doc-name" id={"st-" + docKey + "-name"}>{name || "No file chosen"}</span>
        <button
          className="st-btn"
          type="button"
          id={"st-" + docKey + "-pick"}
          aria-describedby={"st-" + docKey + "-lbl st-" + docKey + "-help " + errId}
          aria-invalid={errors[errId] ? "true" : undefined}
          onClick={() => inputRef.current?.click()}
        >
          <Svg body={UPLOAD} /><span>{name ? "Replace" : "Upload"}</span>
        </button>
        <button className="st-link" type="button" id={"st-" + docKey + "-remove"} hidden={!name} onClick={onRemove}>Remove</button>
      </div>
      <input
        ref={inputRef}
        type="file"
        id={"st-" + docKey + "-input"}
        accept="image/*,application/pdf"
        tabIndex={-1}
        hidden
        onChange={(e) => {
          const picked = e.target.files?.[0];
          e.target.value = "";
          if (picked) onPick(picked);
        }}
      />
      <p className="st-help" id={"st-" + docKey + "-help"}>{hint}</p>
      <Err id={errId} errors={errors} />
    </div>
  );
}

const AVATAR_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const AVATAR_MAX = 5 * 1024 * 1024;
const AVATAR_PX = 256;

/** Downscale to at most 256px so the data URL stays small enough for localStorage. */
const downscale = (dataUrl: string, type: string): Promise<string> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, AVATAR_PX / Math.max(img.naturalWidth, img.naturalHeight));
      const w = Math.max(1, Math.round(img.naturalWidth * scale));
      const h = Math.max(1, Math.round(img.naturalHeight * scale));
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("canvas"));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      // PNG/GIF can carry transparency; photos compress far better as JPEG.
      const keepAlpha = type === "image/png" || type === "image/gif";
      resolve(keepAlpha ? canvas.toDataURL("image/png") : canvas.toDataURL("image/jpeg", 0.88));
    };
    img.onerror = () => reject(new Error("decode"));
    img.src = dataUrl;
  });

/* =====================================================================
   Main body
   ===================================================================== */
interface BodyProps {
  rev: number;
  onSaved: () => void;
  onOpenFrames: (opener: HTMLElement) => void;
  onOpenNet: (net: NetKey, opener: HTMLElement) => void;
}

function ProfileBody({ rev, onSaved, onOpenFrames, onOpenNet }: BodyProps) {
  const { ready, profile: panelProfile, reloadProfile, reduceMotion, toast } = usePanel();
  const [stored, setStored] = useState<StoredProfile | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [focusId, setFocusId] = useState<string | null>(null);

  const setError = useCallback((id: string, message: string): boolean => {
    setErrors((prev) => (prev[id] === message || (!prev[id] && !message) ? prev : { ...prev, [id]: message }));
    return !message;
  }, []);

  /** Write to bt-profile, refresh this page's copy and the shell's top bar. */
  const save = useCallback((patch: Partial<StoredProfile>): StoredProfile => {
    const next = saveProfile(patch);
    setStored(readProfile());
    reloadProfile();
    onSaved();
    return next;
  }, [reloadProfile, onSaved]);

  useEffect(() => {
    if (!focusId) return;
    document.getElementById(focusId)?.focus();
    setFocusId(null);
  }, [focusId]);

  /* ---------- phone / timezone / gender / kyc state ---------- */
  const [dial, setDial] = useState("IN");
  const [phone, setPhone] = useState("");
  const [otpOpen, setOtpOpen] = useState(false);
  const [otpTo, setOtpTo] = useState("");
  const [otp, setOtp] = useState("");
  const [cooldown, setCooldown] = useState(0);

  const [detectedTz, setDetectedTz] = useState("");
  const [zones, setZones] = useState<{ zone: string; label: string }[]>([]);
  const [tz, setTz] = useState("");
  const [gender, setGender] = useState("");

  const [pw, setPw] = useState({ cur: "", next: "", conf: "" });
  const [shown, setShown] = useState({ cur: false, next: false, conf: false });

  const [kyc, setKyc] = useState<Kyc>({ status: "none" });
  const [countries, setCountries] = useState<[string, string][]>([]);
  const [kf, setKf] = useState({ name: "", dob: "", country: "", idType: "", idNum: "", addr: "" });
  const [docs, setDocs] = useState<Record<DocKey, string>>({ idfile: "", addrfile: "" });
  const [dobMax, setDobMax] = useState("");

  // First paint (old profile.js ran once on load). Waits for the panel so the fallback country name is known.
  const loaded = useRef(false);
  useEffect(() => {
    if (!ready || loaded.current) return;
    loaded.current = true;
    const p = readProfile();
    setStored(p);
    const savedCountry = p.phoneCountry || p.country;
    setDial(dialFor(savedCountry) ? (savedCountry as string) : "IN");
    if (p.phone) setPhone(String(p.phone).replace(/^\+\d+\s*/, ""));
    const detected = detectTimezone();
    setDetectedTz(detected);
    setZones(buildZones(detected, p.timezone));
    setTz(p.timezone || detected);
    setGender(p.gender || "");
    const k = readKyc();
    setKyc(k);
    setKf({
      name: k.fullName || p.fullName || "",
      dob: k.dob || "",
      country: k.country || p.country || "",
      idType: k.idType || "",
      idNum: k.idNumber || "",
      addr: k.address || "",
    });
    setDocs({ idfile: k.idFile || "", addrfile: k.addressFile || "" });
    setCountries(buildCountries(panelProfile.country ? [panelProfile.country, panelProfile.countryName] : null));
    setDobMax(isoDate(adultCutoff()));
  }, [ready, panelProfile.country, panelProfile.countryName]);

  // The frames / social dialogs write bt-profile too; re-read when they do.
  useEffect(() => {
    if (loaded.current) setStored(readProfile());
  }, [rev]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const p = stored || {};
  const initials = panelProfile.initials;
  const avatar = p.avatar || "";
  const frame = p.frame || "none";

  /* ---------- avatar ---------- */
  const avatarInput = useRef<HTMLInputElement>(null);
  const onAvatarPicked = (picked: File) => {
    if (!AVATAR_TYPES.includes(picked.type)) {
      setError("st-avatar-err", "That file type isn't supported. Choose a JPG, PNG, GIF or WebP image.");
      return;
    }
    if (picked.size > AVATAR_MAX) {
      setError("st-avatar-err", "That image is larger than 5MB. Choose a smaller file.");
      return;
    }
    setError("st-avatar-err", "");
    const reader = new FileReader();
    reader.onload = () => {
      downscale(String(reader.result), picked.type)
        .then((small) => {
          save({ avatar: small });
          if (readProfile().avatar !== small) {
            setError("st-avatar-err", "Couldn't save the picture in this browser. Try a smaller image.");
            return;
          }
          toast("Picture updated", "Your new avatar is live on your profile.");
        })
        .catch(() => setError("st-avatar-err", "We couldn't read that image. Try another file."));
    };
    reader.onerror = () => setError("st-avatar-err", "We couldn't read that file. Try again.");
    reader.readAsDataURL(picked);
  };

  /* ---------- phone ---------- */
  const fullPhone = dialFor(dial) + " " + digits(phone);
  const phoneVerified = !!p.phoneVerified && p.phone === fullPhone;
  const sendLabel = cooldown > 0 ? "Resend in " + cooldown + "s" : otpOpen ? "Resend code" : "Send code";

  const onPhoneEdit = (nextDial: string, nextPhone: string) => {
    setDial(nextDial);
    setPhone(nextPhone);
    setError("st-phone-err", "");
    const nextFull = dialFor(nextDial) + " " + digits(nextPhone);
    if (otpOpen && !(p.phoneVerified && p.phone === nextFull)) {
      setOtpOpen(false);
      setOtp("");
      setError("st-otp-err", "");
    }
  };

  const onSendCode = () => {
    const n = digits(phone);
    if (n.length < 6 || n.length > 14) {
      setError("st-phone-err", "Enter a valid phone number (6 to 14 digits).");
      setFocusId("st-phone");
      return;
    }
    setError("st-phone-err", "");
    setOtpOpen(true);
    setOtpTo(fullPhone);
    setOtp("");
    setError("st-otp-err", "");
    setCooldown(30);
    setFocusId("st-otp-code");
    toast("Code sent", "Check WhatsApp on " + fullPhone + ". Sandbox: any 6 digits work.");
  };

  const verifyOtp = () => {
    if (!/^\d{6}$/.test(otp)) {
      setError("st-otp-err", "Enter the 6-digit code we sent you.");
      setFocusId("st-otp-code");
      return;
    }
    save({ phone: fullPhone, phoneCountry: dial, phoneVerified: true });
    setOtpOpen(false);
    setOtp("");
    setCooldown(0);
    setFocusId("st-phone");
    toast("Phone verified", fullPhone + " is now linked to your account.");
  };

  /* ---------- password (never stored) ---------- */
  const rules = (value: string) => ({ len: value.length >= 8, letter: /[A-Za-z]/.test(value), number: /\d/.test(value), special: /[^A-Za-z0-9]/.test(value) });
  const strength = useMemo(() => {
    if (!pw.next) return 0;
    const r = rules(pw.next);
    const score = (r.len ? 1 : 0) + (r.letter ? 1 : 0) + (r.number ? 1 : 0) + (r.special ? 1 : 0) + (pw.next.length >= 12 ? 1 : 0);
    return score <= 2 ? 1 : score === 3 ? 2 : score === 4 ? 3 : 4;
  }, [pw.next]);

  const onPwSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const r = rules(pw.next);
    const curErr = pw.cur ? "" : "Enter your current password.";
    let newErr = "";
    if (!pw.next) newErr = "Enter a new password.";
    else if (!r.len) newErr = "Use at least 8 characters.";
    else if (!(r.letter && r.number && r.special)) newErr = "Include a letter, a number and a special character.";
    else if (pw.cur && pw.next === pw.cur) newErr = "Your new password must be different from the current one.";
    let confErr = "";
    if (!pw.conf) confErr = "Confirm your new password.";
    else if (pw.conf !== pw.next) confErr = "Passwords don't match.";
    const ok = [setError("st-pw-cur-err", curErr), setError("st-pw-new-err", newErr), setError("st-pw-conf-err", confErr)];
    const firstBad = ["st-pw-cur", "st-pw-new", "st-pw-conf"][ok.indexOf(false)];
    if (firstBad) {
      setFocusId(firstBad);
      return;
    }
    setPw({ cur: "", next: "", conf: "" });
    setShown({ cur: false, next: false, conf: false });
    toast("Password changed", "Sandbox: use your new password next time you sign in.");
  };

  /* ---------- KYC ---------- */
  const status: KycStatus = kyc.status in STATUS ? kyc.status : "none";
  const info = STATUS[status];
  // A rejected submission goes back to the "fill in" step so the user can resubmit.
  const stepAt = STEPS.findIndex((s) => s[0] === (status === "rejected" ? "draft" : status));
  const locked = status === "pending" || status === "verified";
  let statusText = info.text;
  if (status === "pending" && kyc.submittedAt) {
    statusText = "Submitted " + new Date(kyc.submittedAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) + ". " + statusText;
  }
  if (status === "rejected" && kyc.reviewNote) statusText += " Reviewer's note: " + kyc.reviewNote;

  const setKfField = (key: keyof typeof kf, errId: string) => (value: string) => {
    setKf((prev) => ({ ...prev, [key]: value }));
    setError(errId, "");
  };

  const onDocPicked = (key: DocKey) => (picked: File) => {
    const errId = "st-" + key + "-err";
    if (!DOC_TYPES.test(picked.type)) {
      setError(errId, "Upload an image (JPG, PNG…) or a PDF.");
      return;
    }
    if (picked.size > DOC_MAX) {
      setError(errId, "That file is larger than 10MB.");
      return;
    }
    setError(errId, "");
    setDocs((prev) => ({ ...prev, [key]: picked.name })); // sandbox: only the file name is kept
  };

  const collect = (next: KycStatus): Kyc => ({
    status: next,
    fullName: kf.name.trim(),
    dob: kf.dob,
    country: kf.country,
    idType: kf.idType,
    idNumber: kf.idNum.trim().toUpperCase(),
    address: kf.addr.trim(),
    idFile: docs.idfile,
    addressFile: docs.addrfile,
    submittedAt: next === "pending" ? new Date().toISOString() : kyc.submittedAt || null,
  });

  const validateKyc = (): number => {
    let dobErr = "";
    if (!kf.dob) dobErr = "Enter your date of birth.";
    else {
      const parts = kf.dob.split("-").map(Number);
      const dob = new Date(parts[0], parts[1] - 1, parts[2]);
      if (isNaN(dob.getTime()) || parts[0] < 1900) dobErr = "Enter a valid date.";
      else if (dob > adultCutoff()) dobErr = "You must be at least 18 years old.";
    }
    const name = kf.name.trim();
    const results: [focusId: string, ok: boolean][] = [
      ["st-k-name", setError("st-k-name-err", name.length < 2 || !/[A-Za-z\u00C0-\uFFFF]/.test(name) ? "Enter your full name as shown on your ID." : "")],
      ["st-k-dob", setError("st-k-dob-err", dobErr)],
      ["st-k-country", setError("st-k-country-err", kf.country ? "" : "Choose your country.")],
      ["st-k-idtype", setError("st-k-idtype-err", kf.idType ? "" : "Choose an ID type.")],
      ["st-k-idnum", setError("st-k-idnum-err", /^[A-Za-z0-9]{5,20}$/.test(kf.idNum.trim()) ? "" : "Use 5 to 20 letters and numbers, no spaces.")],
      ["st-k-addr", setError("st-k-addr-err", kf.addr.trim().length >= 10 ? "" : "Enter your full residential address.")],
      ["st-idfile-pick", setError("st-idfile-err", docs.idfile ? "" : "Upload a photo or scan of your ID.")],
      ["st-addrfile-pick", setError("st-addrfile-err", docs.addrfile ? "" : "Upload a proof of address.")],
    ];
    const bad = results.filter((r) => !r[1]);
    if (bad.length) setFocusId(bad[0][0]);
    return bad.length;
  };

  const onKycSave = () => {
    const next = collect("draft");
    writeJSON(KYC_KEY, next);
    setKyc(next);
    toast("Progress saved", "Your KYC draft is saved in this browser.");
  };

  const onKycSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (locked) return;
    const bad = validateKyc();
    if (bad) {
      toast("Check your details", bad === 1 ? "1 field needs attention." : bad + " fields need attention.", "error");
      return;
    }
    const next = collect("pending");
    writeJSON(KYC_KEY, next);
    setKyc(next);
    document.getElementById("st-kyc-status")?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest" });
    toast("KYC submitted", "Your documents are under review. We'll notify you when you're verified.");
  };

  const onApprove = () => {
    const next: Kyc = { ...kyc, status: "verified" };
    writeJSON(KYC_KEY, next);
    setKyc(next);
    setFocusId("st-kyc-wallet");
    toast("KYC verified (sandbox)", "Cash-outs are now unlocked in your wallet.");
  };

  const kycInvalid = (id: string) => (errors[id + "-err"] ? "true" : undefined);

  return (
    <>
      <section className="ah st-hero" aria-labelledby="st-title">
        <div className="ah-floor" aria-hidden="true"></div>
        <div className="st-hero-id">
          <Avatar cls="st-hero-av" frame={frame} avatar={avatar} initials={initials} />
          <div className="ah-txt">
            <p className="ah-tag st-tag"><Icon name="shield" />Profile &amp; KYC verification</p>
            <h1 id="st-title"><span id="st-username">{panelProfile.username}</span></h1>
            <p>Verify your identity to unlock cash-out features</p>
            <Link className="st-public" href="/app/trader/"><Icon name="eye" />View public record</Link>
          </div>
        </div>
        <ul className="st-status" aria-label="Verification status">
          <li className="st-chip is-ok" id="st-chip-email"><Icon name="checkCircle" /><span>Email</span><b>Verified</b></li>
          <li className={"st-chip " + (phoneVerified ? "is-ok" : "is-warn")} id="st-chip-phone"><Icon name="phone" /><span>Phone</span><b>{phoneVerified ? "Verified" : "Unverified"}</b></li>
          <li className={"st-chip " + info.cls} id="st-chip-kyc"><Icon name="shield" /><span>KYC</span><b>{info.chip}</b></li>
        </ul>
      </section>

      <div className="ag st-grid">
        <article className="ac st-c-pic" id="st-picture">
          <div className="ac-h"><h2><Icon name="user" />Profile picture</h2></div>
          <div className="st-pic">
            <Avatar cls="st-pic-av" frame={frame} avatar={avatar} initials={initials} />
            <button className="ab2 st-frames-btn" id="st-frames-open" type="button" onClick={(e) => onOpenFrames(e.currentTarget)}><Icon name="layers" />Manage avatar frames</button>
            <p className="st-muted">Upload a profile picture to personalize your account</p>
            <div className="st-pic-actions">
              <button
                className="st-btn st-btn-grad"
                id="st-avatar-pick"
                type="button"
                aria-describedby="st-avatar-help st-avatar-err"
                aria-invalid={errors["st-avatar-err"] ? "true" : undefined}
                onClick={() => avatarInput.current?.click()}
              >
                <Svg body={UPLOAD} /><span>Change picture</span>
              </button>
              <button
                className="st-link"
                id="st-avatar-remove"
                type="button"
                hidden={!avatar}
                onClick={() => {
                  save({ avatar: undefined });
                  setFocusId("st-avatar-pick");
                  toast("Picture removed", "Your initials are shown instead.");
                }}
              >
                Remove
              </button>
            </div>
            <input
              ref={avatarInput}
              type="file"
              id="st-avatar-file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              tabIndex={-1}
              hidden
              onChange={(e) => {
                const picked = e.target.files?.[0];
                e.target.value = "";
                if (picked) onAvatarPicked(picked);
              }}
            />
            <p className="st-help" id="st-avatar-help">JPG, PNG, GIF or WebP. Max 5MB.</p>
            <Err id="st-avatar-err" errors={errors} />
          </div>
        </article>

        <article className="ac st-c-acct" id="st-account">
          <div className="ac-h"><h2><Icon name="settings" />Account information</h2><p className="st-note">Verify your email and phone to unlock all features.</p></div>
          <div className="st-fields">
            <div className="st-field st-wide">
              <label htmlFor="st-email">Email address</label>
              <div className="st-row">
                <input className="st-input" id="st-email" type="email" readOnly aria-describedby="st-email-note" value={p.email || ""} placeholder={stored && !p.email ? "No email on file" : undefined} />
                <span className="st-badge is-ok"><Icon name="check" />Verified</span>
              </div>
              <p className="st-help" id="st-email-note"><Icon name="lock" />Email is permanently locked after verification. Contact support to change.</p>
            </div>

            <div className="st-field st-wide">
              <label htmlFor="st-phone">Phone number</label>
              <div className="st-row st-phone-row">
                <select className="st-input st-dial" id="st-dial" aria-label="Country dial code" value={dial} onChange={(e) => onPhoneEdit(e.target.value, phone)}>
                  {DIALS.map(([iso, code]) => <option key={iso} value={iso}>{iso + " " + code}</option>)}
                </select>
                <input
                  className="st-input st-phone"
                  id="st-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel-national"
                  placeholder="98765 43210"
                  aria-describedby="st-phone-help st-phone-err"
                  aria-invalid={errors["st-phone-err"] ? "true" : undefined}
                  value={phone}
                  onChange={(e) => onPhoneEdit(dial, e.target.value)}
                />
                <span className={"st-badge" + (phoneVerified ? "" : " is-warn")} id="st-phone-badge">{phoneVerified ? "Verified" : "Unverified"}</span>
                <button className="st-btn" id="st-phone-send" type="button" disabled={cooldown > 0 || phoneVerified} onClick={onSendCode}>{sendLabel}</button>
              </div>
              <Err id="st-phone-err" errors={errors} />
              <div className="st-otp" id="st-otp" hidden={!otpOpen}>
                <label htmlFor="st-otp-code">6-digit code</label>
                <div className="st-row">
                  <input
                    className="st-input st-otp-input"
                    id="st-otp-code"
                    inputMode="numeric"
                    maxLength={6}
                    autoComplete="one-time-code"
                    placeholder="000000"
                    aria-describedby="st-otp-help st-otp-err"
                    aria-invalid={errors["st-otp-err"] ? "true" : undefined}
                    value={otp}
                    onChange={(e) => {
                      setOtp(digits(e.target.value).slice(0, 6));
                      setError("st-otp-err", "");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        verifyOtp();
                      }
                    }}
                  />
                  <button className="st-btn st-btn-grad" id="st-otp-verify" type="button" onClick={verifyOtp}>Verify</button>
                </div>
                <p className="st-help" id="st-otp-help">Code sent to <b id="st-otp-to">{otpTo}</b> on WhatsApp. Sandbox: any 6 digits work.</p>
                <Err id="st-otp-err" errors={errors} />
              </div>
              <p className="st-help" id="st-phone-help">Enter your phone number and click Send code to verify via WhatsApp.</p>
            </div>

            <div className="st-field">
              <label htmlFor="st-tz">Timezone</label>
              <div className="st-row">
                <select className="st-input" id="st-tz" aria-describedby="st-tz-help" value={tz} onChange={(e) => setTz(e.target.value)}>
                  {zones.map((z) => <option key={z.zone} value={z.zone}>{z.label}</option>)}
                </select>
                <button
                  className="st-btn"
                  id="st-tz-save"
                  type="button"
                  disabled={!tz || tz === (p.timezone || detectedTz)}
                  onClick={() => {
                    save({ timezone: tz });
                    toast("Timezone updated", "Tournament dates now show in " + tz.replace(/_/g, " ") + ".");
                  }}
                >
                  Update
                </button>
              </div>
              <p className="st-help" id="st-tz-help">Detected timezone: <b id="st-tz-detected">{detectedTz}</b>. Tournament dates will display in your selected timezone.</p>
            </div>

            <div className="st-field">
              <label htmlFor="st-gender">Gender</label>
              <div className="st-row">
                <select className="st-input" id="st-gender" value={gender} onChange={(e) => setGender(e.target.value)}>
                  <option value="">Select gender</option>
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                  <option value="non-binary">Non-binary</option>
                  <option value="undisclosed">Prefer not to say</option>
                </select>
                <button
                  className="st-btn"
                  id="st-gender-save"
                  type="button"
                  disabled={!gender || gender === (p.gender || "")}
                  onClick={() => {
                    save({ gender });
                    toast("Profile updated", "Gender saved.");
                  }}
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        </article>

        <article className="ac st-c-social" id="st-social">
          <div className="ac-h"><h2><Icon name="globe" />Public social verification</h2></div>
          <p className="st-muted">Verify your public community profiles to display on your dossier. These do not allow sign-in.</p>
          <ul className="st-social">
            {(Object.keys(NETS) as NetKey[]).map((key) => {
              const net = NETS[key];
              const handle = typeof p[key] === "string" ? (p[key] as string) : "";
              return (
                <li key={key} className={"st-net n-" + key + (handle ? " is-on" : "")} data-st-net={key}>
                  <span className="st-net-ico"><Svg body={net.icon} /></span>
                  <span className="st-net-txt"><b>{net.name}</b><small data-st-net-status="">{handle ? "Connected as @" + handle : "Not connected"}</small></span>
                  <button
                    className="st-btn st-btn-grad"
                    type="button"
                    data-st-net-btn=""
                    aria-label={(handle ? "Disconnect " : "Connect ") + net.name}
                    onClick={(e) => {
                      if (readProfile()[key]) {
                        save({ [key]: undefined });
                        toast(net.name + " disconnected", "It no longer shows on your public record.");
                        return;
                      }
                      onOpenNet(key, e.currentTarget);
                    }}
                  >
                    {handle ? "Disconnect" : "Connect"}
                  </button>
                </li>
              );
            })}
          </ul>
        </article>

        <article className="ac st-c-pw" id="st-password">
          <div className="ac-h"><h2><Icon name="lock" />Change password</h2></div>
          <p className="st-muted">Use a strong password with letters, numbers, and a special character.</p>
          <form className="st-pw-form" id="st-pw-form" noValidate onSubmit={onPwSubmit}>
            <input type="text" name="username" autoComplete="username" hidden readOnly value={panelProfile.username} />
            <PwField
              id="st-pw-cur" label="Current password" auto="current-password" value={pw.cur} shown={shown.cur} errors={errors}
              onChange={(v) => { setPw((s) => ({ ...s, cur: v })); setError("st-pw-cur-err", ""); }}
              onToggle={() => setShown((s) => ({ ...s, cur: !s.cur }))}
            />
            <div className="st-pw-pair">
              <PwField
                id="st-pw-new" label="New password" auto="new-password" value={pw.next} shown={shown.next} errors={errors}
                onChange={(v) => { setPw((s) => ({ ...s, next: v })); setError("st-pw-new-err", ""); }}
                onToggle={() => setShown((s) => ({ ...s, next: !s.next }))}
              />
              <PwField
                id="st-pw-conf" label="Confirm new password" auto="new-password" value={pw.conf} shown={shown.conf} errors={errors}
                onChange={(v) => { setPw((s) => ({ ...s, conf: v })); setError("st-pw-conf-err", ""); }}
                onToggle={() => setShown((s) => ({ ...s, conf: !s.conf }))}
              />
            </div>
            <div className="st-meter" data-level={String(strength)}>
              <span className="st-meter-bar" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
              <span className="st-meter-txt" id="st-pw-strength" aria-live="polite">{"Strength: " + ["—", "Weak", "Fair", "Good", "Strong"][strength]}</span>
            </div>
            <button className="st-btn st-btn-grad st-pw-submit" type="submit"><Icon name="lock" /><span>Change password</span></button>
          </form>
        </article>

        <article className="ac st-c-kyc" id="kyc">
          <div className="ac-h"><h2><Icon name="shield" />Submit KYC documents</h2><span className={"ac-chip is-" + status} id="st-kyc-badge">{info.chip}</span></div>
          <p className={"st-lock-note" + (status === "verified" ? " is-ok" : "")} id="st-kyc-lock" hidden={!locked}>
            <Icon name="lock" />
            <span id="st-kyc-lock-txt">
              {status === "verified" ? "Your identity is verified. Contact support to change these details." : "Your documents are under review, so the form is locked."}
            </span>
          </p>
          <form id="st-kyc-form" noValidate onSubmit={onKycSubmit}>
            <fieldset className="st-kyc-fs" id="st-kyc-fs" disabled={locked}>
              <legend className="st-sr">KYC details</legend>
              <div className="st-fields">
                <div className="st-field">
                  <label htmlFor="st-k-name">Full name</label>
                  <input className="st-input" id="st-k-name" autoComplete="name" placeholder="As shown on your ID" aria-describedby="st-k-name-err" aria-invalid={kycInvalid("st-k-name")} value={kf.name} onChange={(e) => setKfField("name", "st-k-name-err")(e.target.value)} />
                  <Err id="st-k-name-err" errors={errors} />
                </div>
                <div className="st-field">
                  <label htmlFor="st-k-dob">Date of birth</label>
                  <input className="st-input" id="st-k-dob" type="date" autoComplete="bday" min="1900-01-01" max={dobMax || undefined} aria-describedby="st-k-dob-help st-k-dob-err" aria-invalid={kycInvalid("st-k-dob")} value={kf.dob} onChange={(e) => setKfField("dob", "st-k-dob-err")(e.target.value)} />
                  <p className="st-help" id="st-k-dob-help">You must be 18 or older.</p>
                  <Err id="st-k-dob-err" errors={errors} />
                </div>
                <div className="st-field">
                  <label htmlFor="st-k-country">Country</label>
                  <select className="st-input" id="st-k-country" autoComplete="country" aria-describedby="st-k-country-err" aria-invalid={kycInvalid("st-k-country")} value={kf.country} onChange={(e) => setKfField("country", "st-k-country-err")(e.target.value)}>
                    <option value="">Choose country</option>
                    {countries.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
                  </select>
                  <Err id="st-k-country-err" errors={errors} />
                </div>
                <div className="st-field">
                  <label htmlFor="st-k-idtype">ID type</label>
                  <select className="st-input" id="st-k-idtype" aria-describedby="st-k-idtype-err" aria-invalid={kycInvalid("st-k-idtype")} value={kf.idType} onChange={(e) => setKfField("idType", "st-k-idtype-err")(e.target.value)}>
                    <option value="">Choose ID type</option>
                    <option value="passport">Passport</option>
                    <option value="national-id">National ID</option>
                    <option value="driving-licence">Driving licence</option>
                  </select>
                  <Err id="st-k-idtype-err" errors={errors} />
                </div>
                <div className="st-field">
                  <label htmlFor="st-k-idnum">ID number</label>
                  <input className="st-input st-mono" id="st-k-idnum" placeholder="A12345678" maxLength={20} autoComplete="off" spellCheck={false} aria-describedby="st-k-idnum-err" aria-invalid={kycInvalid("st-k-idnum")} value={kf.idNum} onChange={(e) => setKfField("idNum", "st-k-idnum-err")(e.target.value)} />
                  <Err id="st-k-idnum-err" errors={errors} />
                </div>
                <div className="st-field st-wide">
                  <label htmlFor="st-k-addr">Residential address</label>
                  <textarea className="st-input" id="st-k-addr" rows={3} autoComplete="street-address" placeholder="House, street, city, postcode" aria-describedby="st-k-addr-err" aria-invalid={kycInvalid("st-k-addr")} value={kf.addr} onChange={(e) => setKfField("addr", "st-k-addr-err")(e.target.value)}></textarea>
                  <Err id="st-k-addr-err" errors={errors} />
                </div>
                <DocUpload
                  docKey="idfile" label="ID document" hint="Photo or scan of your ID. Image or PDF, max 10MB." name={docs.idfile} errors={errors}
                  onPick={onDocPicked("idfile")}
                  onRemove={() => { setDocs((d) => ({ ...d, idfile: "" })); setFocusId("st-idfile-pick"); }}
                />
                <DocUpload
                  docKey="addrfile" label="Proof of address" hint="Utility bill or bank statement under 3 months old. Image or PDF, max 10MB." name={docs.addrfile} errors={errors}
                  onPick={onDocPicked("addrfile")}
                  onRemove={() => { setDocs((d) => ({ ...d, addrfile: "" })); setFocusId("st-addrfile-pick"); }}
                />
              </div>
              <div className="st-kyc-actions">
                <button className="st-btn" type="button" id="st-kyc-save" onClick={onKycSave}>Save progress</button>
                <button className="btn b-ember" type="submit" id="st-kyc-submit"><Icon name="shield" />Submit KYC</button>
              </div>
            </fieldset>
          </form>
        </article>

        <article className="ac st-c-status" id="st-kyc-status">
          <div className="ac-h"><h2><Icon name="pulse" />KYC status</h2></div>
          <ol className="st-steps" id="st-steps">
            {STEPS.map(([step, title, sub], i) => {
              const done = i < stepAt || status === "verified";
              const current = i === stepAt;
              return (
                <li key={step} data-step={step} className={[done ? "is-done" : "", current ? "is-current" : ""].filter(Boolean).join(" ") || undefined} aria-current={current ? "step" : undefined}>
                  <i aria-hidden="true"><Icon name="check" /></i>
                  <span><b>{title}</b><small>{sub}</small></span>
                </li>
              );
            })}
          </ol>
          <p className="st-status-txt" id="st-kyc-text">{statusText}</p>
          <Link className="ab2" id="st-kyc-wallet" href="/app/wallet/" hidden={status !== "verified"}><Icon name="wallet" />Go to wallet</Link>
          <div className="st-sandbox" id="st-kyc-sandbox" hidden={status !== "pending"}>
            <span>Sandbox only</span>
            <button className="st-btn" type="button" id="st-kyc-approve" onClick={onApprove}><Icon name="bolt" /><span>Simulate approval</span></button>
          </div>
        </article>
      </div>

      <footer className="ap-foot">
        <p>
          Sandbox preview (sample data): phone codes, social links, uploads and password changes are simulated in this browser until accounts go live. Need a change to your email?{" "}
          <a href="/contact/">Contact support</a>.
        </p>
      </footer>
    </>
  );
}

/* =====================================================================
   Dialogs (rendered after </main>)
   ===================================================================== */
function useModal(open: boolean, onOpened?: () => void) {
  const ref = useRef<HTMLDialogElement>(null);
  const onOpenedRef = useRef(onOpened);
  onOpenedRef.current = onOpened;
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      onOpenedRef.current?.();
    } else if (!open && dialog.open) dialog.close();
  }, [open]);
  return ref;
}

function FramesDialog({ open, onClosed, onSaved }: { open: boolean; onClosed: () => void; onSaved: () => void }) {
  const { profile, reloadProfile, toast } = usePanel();
  const [choice, setChoice] = useState("none");
  const [avatar, setAvatar] = useState("");
  const radios = useRef<Record<string, HTMLInputElement | null>>({});

  const ref = useModal(open, () => {
    const p = readProfile();
    const current = FRAMES.some(([key]) => key === p.frame) ? (p.frame as string) : "none";
    setChoice(current);
    setAvatar(p.avatar || "");
    radios.current[current]?.focus();
  });

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    saveProfile({ frame: choice });
    reloadProfile();
    onSaved();
    ref.current?.close();
    const label = FRAMES.find(([key]) => key === choice)?.[1];
    toast("Frame applied", label ? label + " frame equipped." : "");
  };

  return (
    <dialog className="st-modal" id="st-frames" aria-labelledby="st-frames-title" ref={ref} onClose={onClosed} onClick={(e) => { if (e.target === e.currentTarget) ref.current?.close(); }}>
      <form className="st-modal-in" id="st-frames-form" onSubmit={onSubmit}>
        <div className="st-modal-h">
          <h2 id="st-frames-title">Avatar frames</h2>
          <button className="st-x" type="button" data-st-close="" aria-label="Close avatar frames" onClick={() => ref.current?.close()}><Icon name="close" /></button>
        </div>
        <p className="st-muted">Pick a frame for your avatar. It shows on your profile and public record.</p>
        <fieldset className="st-frames">
          <legend className="st-sr">Frame style</legend>
          {FRAMES.map(([key, label]) => (
            <label key={key} className="st-frame-opt">
              <input
                type="radio"
                name="frame"
                value={key}
                checked={choice === key}
                onChange={() => setChoice(key)}
                ref={(node) => {
                  radios.current[key] = node;
                }}
              />
              <Avatar cls="st-frame-av" frame={key} avatar={avatar} initials={profile.initials} preview />
              <span>{label}</span>
            </label>
          ))}
        </fieldset>
        <div className="st-modal-f">
          <button className="st-btn" type="button" data-st-close="" onClick={() => ref.current?.close()}>Cancel</button>
          <button className="st-btn st-btn-grad" type="submit">Apply frame</button>
        </div>
      </form>
    </dialog>
  );
}

function NetDialog({ net, onClosed, onSaved }: { net: NetKey | null; onClosed: () => void; onSaved: () => void }) {
  const { reloadProfile, toast } = usePanel();
  const [handle, setHandle] = useState("");
  const [error, setErrorText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  // Keep the last network while the close animation runs so the title doesn't blank out.
  const [shownNet, setShownNet] = useState<NetKey>("discord");

  const ref = useModal(net !== null, () => {
    setHandle("");
    setErrorText("");
    inputRef.current?.focus();
  });

  useEffect(() => {
    if (net) setShownNet(net);
  }, [net]);

  const info = NETS[net || shownNet];

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!net) return;
    const value = handle.trim().replace(/^@/, "");
    if (!info.pattern.test(value)) {
      setErrorText(value ? "Use " + info.rule + "." : "Enter your " + info.name + " username.");
      inputRef.current?.focus();
      return;
    }
    saveProfile({ [net]: value });
    reloadProfile();
    onSaved();
    ref.current?.close();
    toast(info.name + " connected", "@" + value + " now shows on your public record.");
  };

  return (
    <dialog className="st-modal st-modal-sm" id="st-net-dlg" aria-labelledby="st-net-title" ref={ref} onClose={onClosed} onClick={(e) => { if (e.target === e.currentTarget) ref.current?.close(); }}>
      <form className="st-modal-in" id="st-net-form" noValidate onSubmit={onSubmit}>
        <div className="st-modal-h">
          <h2 id="st-net-title">{"Connect " + info.name}</h2>
          <button className="st-x" type="button" data-st-close="" aria-label="Close" onClick={() => ref.current?.close()}><Icon name="close" /></button>
        </div>
        <div className="st-field">
          <label htmlFor="st-net-handle" id="st-net-label">{info.name + " username"}</label>
          <div className="st-at">
            <span aria-hidden="true">@</span>
            <input
              ref={inputRef}
              className="st-input"
              id="st-net-handle"
              autoComplete="off"
              spellCheck={false}
              aria-describedby="st-net-help st-net-err"
              aria-invalid={error ? "true" : undefined}
              value={handle}
              onChange={(e) => {
                setHandle(e.target.value);
                setErrorText("");
              }}
            />
          </div>
          <p className="st-help" id="st-net-help">Sandbox: we only save the handle, nothing is linked.</p>
          <p className="st-err" id="st-net-err" hidden={!error}>{error}</p>
        </div>
        <div className="st-modal-f">
          <button className="st-btn" type="button" data-st-close="" onClick={() => ref.current?.close()}>Cancel</button>
          <button className="st-btn st-btn-grad" type="submit">Connect</button>
        </div>
      </form>
    </dialog>
  );
}

/** Client wrapper: the two dialogs live in PanelShell's `after` slot, so dialog state sits above body + dialogs. */
export default function ProfileView() {
  const [rev, setRev] = useState(0);
  const [framesOpen, setFramesOpen] = useState(false);
  const [net, setNet] = useState<NetKey | null>(null);
  const opener = useRef<HTMLElement | null>(null);

  const bump = useCallback(() => setRev((r) => r + 1), []);
  const restoreFocus = () => {
    const node = opener.current;
    if (node && document.contains(node)) node.focus();
  };

  return (
    <PanelShell
      current="profile"
      crumb="Profile & KYC"
      after={
        <>
          <FramesDialog open={framesOpen} onSaved={bump} onClosed={() => { setFramesOpen(false); restoreFocus(); }} />
          <NetDialog net={net} onSaved={bump} onClosed={() => { setNet(null); restoreFocus(); }} />
        </>
      }
    >
      <ProfileBody
        rev={rev}
        onSaved={bump}
        onOpenFrames={(from) => {
          opener.current = from;
          setFramesOpen(true);
        }}
        onOpenNet={(key, from) => {
          opener.current = from;
          setNet(key);
        }}
      />
    </PanelShell>
  );
}
