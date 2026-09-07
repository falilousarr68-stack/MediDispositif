import Image from "next/image";

export function ConsomcareLogo({
  className = "",
  size = "default",
}: {
  className?: string;
  size?: "default" | "large" | "small";
}) {
  const sizeClasses = {
    small: "h-8 w-8",
    default: "h-12 w-12",
    large: "h-16 w-16",
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Image
        src="/consomcare-logo.svg"
        alt="Consomcare"
        width={64}
        height={64}
        className={sizeClasses[size]}
        priority
      />
    </div>
  );
}

export function ConsomcareLogoText({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <ConsomcareLogo size="default" />
      <span className="font-bold text-xl text-green-700 dark:text-green-400">
        CONSOMCARE
      </span>
    </div>
  );
}
