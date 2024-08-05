import { EthDrive } from "@/components/EthDrive";

export default function Page({ params }: { params: { path: string[] } }) {
  const path = params.path.join("/");
  return <EthDrive path={path} />;
}
