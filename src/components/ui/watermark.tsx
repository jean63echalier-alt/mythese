export function Watermark({ className = "" }: { className?: string }) {
  return (
    <p className={`watermark ${className}`}>
      💡 Suggestion Mythese — à reformuler dans ton style
    </p>
  );
}
