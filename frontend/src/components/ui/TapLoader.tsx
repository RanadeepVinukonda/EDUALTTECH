export default function TapLoader({ className }: { className?: string }) {
  return (
    <div className={className} aria-hidden="true">
      <div className="tap-hand">
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
