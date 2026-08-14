import { LuArrowRight } from "react-icons/lu";

import { Link } from "./NextRouter.jsx";

export const learningCardPalette = [
  { accent: "#f7bd08", deep: "#b98100" },
  { accent: "#3f86f7", deep: "#1d5fc5" },
  { accent: "#f34c55", deep: "#bf2733" },
  { accent: "#22c765", deep: "#07853a" },
  { accent: "#ff741b", deep: "#bf4700" },
  { accent: "#11b8cd", deep: "#087b8b" },
  { accent: "#a94cf4", deep: "#7230b2" },
  { accent: "#f7a7b7", deep: "#c85d73" },
];

export const learningCardPatterns = ["checker", "stripes", "tiles", "columns"];

export default function LearningCategoryCard({
  accent = learningCardPalette[0].accent,
  actionLabel = "Learn now",
  badge,
  children,
  className = "",
  deep = learningCardPalette[0].deep,
  description,
  footer,
  href,
  pattern = "checker",
  subtitle,
  title,
  visual,
}) {
  return (
    <article
      className={`snp-learning-card ${className}`}
      style={{ "--snp-card-accent": accent, "--snp-card-deep": deep }}
    >
      <div className={`snp-learning-card-art snp-learning-pattern-${pattern}`}>
        {badge && <span className="snp-learning-card-badge">{badge}</span>}
        <div className="snp-learning-card-visual" aria-hidden="true">{visual}</div>
      </div>
      <div className="snp-learning-card-body">
        <h2 className="snp-learning-card-title">{title}</h2>
        {subtitle && <p className="snp-learning-card-subtitle">{subtitle}</p>}
        {description && <p className="snp-learning-card-description">{description}</p>}
        {children}
        {footer ?? (href ? (
          <div className="snp-learning-card-footer">
            <Link className="snp-learning-card-action" to={href}>{actionLabel}</Link>
            <Link className="snp-learning-card-arrow" aria-label={`${actionLabel}: ${title}`} to={href}><LuArrowRight /></Link>
          </div>
        ) : null)}
      </div>
    </article>
  );
}
