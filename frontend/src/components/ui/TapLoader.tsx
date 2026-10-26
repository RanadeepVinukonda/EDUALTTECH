export default function TapLoader({ className }: { className?: string }) {
  return (
    <div className={className} role="status">
      <span className="sr-only">Loading</span>
      <div className="tap-hand" aria-hidden="true">
        <div className="tap-finger" />
        <div className="tap-finger" />
        <div className="tap-finger" />
        <div className="tap-finger" />
        <div className="tap-palm" />
        <div className="tap-thumb" />
      </div>
    </div>
  );
}
