const styles =
  "fixed top-0 left-1/2 -translate-x-1/2 bg-black text-white p-4 w-48 h-10 rounded-b-xl transition-[width,height,border-radius] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] hover:w-lg hover:h-32 hover:rounded-b-3xl before:absolute before:top-0 before:-left-3 before:size-3 before:content-[''] before:bg-[radial-gradient(circle_at_0_100%,transparent_12px,black_12.5px)] after:absolute after:top-0 after:-right-3 after:size-3 after:content-[''] after:bg-[radial-gradient(circle_at_100%_100%,transparent_12px,black_12.5px)]";

export function Notch() {
  return <div className={styles}></div>;
}

function NotchTab() {
  return <div>tab 1</div>;
}
