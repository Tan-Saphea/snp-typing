import { Rate } from "antd";
import { LuStar } from "react-icons/lu";

export default function Stars({ count = 0, showValue = false, size = 16 }) {
  return (
    <span className="inline-flex items-center gap-1" aria-label={`${count} out of 3 stars`}>
      <Rate
        count={3}
        value={count}
        disabled
        style={{ fontSize: size, color: "#fa8c16" }}
        character={<LuStar fill="currentColor" size={size} />}
      />
      {showValue && (
        <span className="ml-1 text-xs font-black text-[#fa8c16]">
          {count}/3
        </span>
      )}
    </span>
  );
}
