import Image from "next/image";

export default function PhotoSlot({
  label,
  ratio = "4/3",
  src,
  priority = false,
}: {
  label: string;
  ratio?: string;
  src?: string;
  priority?: boolean;
}) {
  if (src) {
    return (
      <figure className="overflow-hidden rounded-lg" style={{ aspectRatio: ratio }}>
        <Image
          src={src}
          alt={label}
          width={1000}
          height={750}
          priority={priority}
          loading={priority ? undefined : "lazy"}
          className="h-full w-full object-cover"
        />
      </figure>
    );
  }
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 text-gray-400"
      style={{ aspectRatio: ratio }}
    >
      <span className="text-3xl">📷</span>
      <span className="text-xs font-medium">{label}</span>
      <span className="text-[10px] text-gray-400">(작업 사진 교체 예정)</span>
    </div>
  );
}
