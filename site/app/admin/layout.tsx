export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[calc(100vh-56px)] bg-canvas">
      <div className="max-w-[900px] mx-auto px-6 py-10">
        {children}
      </div>
    </div>
  );
}
