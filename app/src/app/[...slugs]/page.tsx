import { EthDrive } from "@/components/EthDrive";

export default function Page({ params }: { params: { slugs: string[] } }) {
  const path = params.slugs.join("/");
  return <EthDrive path={path} />;
}
