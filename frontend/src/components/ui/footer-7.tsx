import React from "react";
import { Link } from "react-router-dom";
import { FaFacebook, FaInstagram, FaLinkedin, FaTwitter } from "react-icons/fa";

interface Footer7Props {
  logo?: {
    url: string;
    src: string;
    alt: string;
    title: string;
  };
  sections?: Array<{
    title: string;
    links: Array<{ name: string; href: string }>;
  }>;
  description?: string;
  socialLinks?: Array<{
    icon: React.ReactElement;
    href: string;
    label: string;
  }>;
  copyright?: string;
  legalLinks?: Array<{
    name: string;
    href: string;
  }>;
}

const defaultSections = [
  {
    title: "Collections",
    links: [
      { name: "Accueil", href: "/" },
      { name: "Les collections", href: "/collection" },
      { name: "Sur mesure", href: "/sur-mesure" },
      { name: "Boutique", href: "/boutique" },
    ],
  },
  {
    title: "Assistance",
    links: [
      { name: "Contact commande", href: "/contact" },
      { name: "Panier", href: "/panier" },
      { name: "Login", href: "/login" },
    ],
  },
];

const defaultSocialLinks = [
  { icon: <FaInstagram className="h-5 w-5" />, href: "#", label: "Instagram" },
  { icon: <FaFacebook className="h-5 w-5" />, href: "#", label: "Facebook" },
  { icon: <FaTwitter className="h-5 w-5" />, href: "#", label: "Twitter" },
  { icon: <FaLinkedin className="h-5 w-5" />, href: "#", label: "LinkedIn" },
];

const defaultLegalLinks = [
  { name: "Mentions legales", href: "/mentions-legales" },
  { name: "CGV", href: "/cgv" },
];

function FooterNavLink({
  href,
  className,
  children,
  ...rest
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
} & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  if (href.startsWith("/")) {
    return (
      <Link to={href} className={className} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <a href={href} className={className} {...rest}>
      {children}
    </a>
  );
}

export const Footer7 = ({
  logo = {
    url: "/",
    src: "/logo-marcelina.svg",
    alt: "Logo Maison Marcelina",
    title: "Maison Marcelina",
  },
  sections = defaultSections,
  description = "Maison Marcelina",
  socialLinks = defaultSocialLinks,
  copyright = "© 2026 Maison Marcelina.",
  legalLinks = defaultLegalLinks,
}: Footer7Props) => {
  const footerColumns = [
    ...sections,
    {
      title: "Informations legales",
      links: legalLinks,
    },
  ];

  return (
    <section className="py-12 md:py-16">
      <div className="mx-auto w-full max-w-[1300px] px-3 md:px-5">
        <div className="flex w-full flex-col justify-between gap-10 lg:flex-row lg:items-start lg:text-left">
          <div className="flex w-full flex-col justify-between gap-5 lg:max-w-[340px] lg:items-start">
            <div className="flex items-center gap-3">
              <FooterNavLink href={logo.url}>
                <img
                  src={logo.src}
                  alt={logo.alt}
                  title={logo.title}
                  className="h-10 w-auto object-contain"
                />
              </FooterNavLink>
            </div>

            <p className="max-w-[75%] text-xs uppercase tracking-[0.11em] text-[#6a4d3f]">
              {description}
            </p>

            <ul className="m-0 flex list-none items-center space-x-5 p-0 text-[#6a4d3f]">
              {socialLinks.map((social) => (
                <li key={social.label} className="font-medium transition hover:text-[#4e3024]">
                  <FooterNavLink href={social.href} className="inline-flex" aria-label={social.label}>
                    {social.icon}
                  </FooterNavLink>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid w-full gap-8 sm:grid-cols-2 lg:max-w-[760px] lg:grid-cols-3 lg:gap-16">
            {footerColumns.map((section) => (
              <div key={section.title}>
                <h3 className="mb-4 text-xs uppercase tracking-[0.12em] text-[#4e3024]">
                  {section.title}
                </h3>
                <ul className="m-0 list-none space-y-3 p-0 text-sm text-[#6a4d3f]">
                  {section.links.map((link) => (
                    <li key={link.name} className="font-medium transition hover:text-[#4e3024]">
                      <FooterNavLink href={link.href}>{link.name}</FooterNavLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-col justify-between gap-4 border-t border-[#6a4d3f24] py-6 text-xs uppercase tracking-[0.08em] text-[#6a4d3f] md:flex-row md:items-start">
          <p>{copyright}</p>
        </div>
      </div>
    </section>
  );
};
