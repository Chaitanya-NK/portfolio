import {
  FaLinkedinIn, FaGithub, FaXTwitter, FaInstagram, FaReddit, FaYoutube, FaFacebook,
  FaMedium, FaDev, FaDribbble, FaBehance, FaStackOverflow, FaDiscord, FaTelegram,
  FaWhatsapp, FaGlobe, FaEnvelope, FaLink,
} from "react-icons/fa6";

const RULES: [RegExp, React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>][] = [
  [/linkedin/, FaLinkedinIn],
  [/github/, FaGithub],
  [/twitter|x\.com|^x$|^x\b/, FaXTwitter],
  [/instagram/, FaInstagram],
  [/reddit/, FaReddit],
  [/youtube|youtu\.be/, FaYoutube],
  [/facebook|fb\.com/, FaFacebook],
  [/medium/, FaMedium],
  [/dev\.to|^dev$/, FaDev],
  [/dribbble/, FaDribbble],
  [/behance/, FaBehance],
  [/stack ?overflow/, FaStackOverflow],
  [/discord/, FaDiscord],
  [/telegram|t\.me/, FaTelegram],
  [/whatsapp|wa\.me/, FaWhatsapp],
  [/email|mail/, FaEnvelope],
  [/website|portfolio|blog/, FaGlobe],
];

function pick(platform: string, url?: string) {
  const p = platform.toLowerCase();
  for (const [re, Icon] of RULES) if (re.test(p)) return Icon;
  if (url) {
    try {
      const host = new URL(url).hostname.toLowerCase();
      for (const [re, Icon] of RULES) if (re.test(host)) return Icon;
    } catch {}
    if (url.startsWith("mailto:")) return FaEnvelope;
  }
  return FaLink;
}

export function SocialIcon({ platform, url, className = "h-4 w-4" }: { platform: string; url?: string; className?: string }) {
  const Icon = pick(platform, url);
  return <Icon className={className} aria-hidden />;
}

export function SocialLinks({ socials }: { socials: { platform?: string; label?: string; url: string }[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {socials.map((x, i) => {
        const name = x.platform ?? x.label ?? "Link";
        const external = /^https?:/i.test(x.url);
        return (
          <li key={i}>
            <a
              href={x.url}
              aria-label={name}
              title={name}
              {...(external ? { target: "_blank", rel: "noreferrer noopener" } : {})}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-[#23232F] bg-[#12121A] text-[#9A9AAE] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              <SocialIcon platform={name} url={x.url} className="h-[1.15rem] w-[1.15rem]" />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
