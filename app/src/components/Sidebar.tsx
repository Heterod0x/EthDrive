export function Sidebar({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-80 border-r">
      <div className="h-full p-4 space-y-4">{children}</div>
    </div>
  );
}
