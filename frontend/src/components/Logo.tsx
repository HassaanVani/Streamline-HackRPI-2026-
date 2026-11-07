import { brandAssets, type Theme } from "../brand";
export default function Logo({ theme }: { theme: Theme }) {
  return (
    <img
      src={brandAssets[theme]}
      width="40"
      height="40"
      alt=""
      aria-hidden="true"
    />
  );
}
