import { ReactNode } from "react";

interface ContentContainerProps {
  children: ReactNode;
  className?: string;
}

export function ContentContainer({ children, className = "" }: ContentContainerProps) {
  return (
    <div className="w-full">
      <div className={`max-w-[800px] md:max-w-[1200px] mx-auto px-4 ${className}`}>
        {children}
      </div>
    </div>
  );
}
