import { useState } from "react";
import { Button } from "@/components/common/Button";
import { datedFilename, downloadText } from "@/lib/browser/download";

interface DownloadButtonProps {
  text: string;
  baseName: string;
  extension: string;
  mime?: string;
  disabled?: boolean;
}

export function DownloadButton({
  text,
  baseName,
  extension,
  mime = "text/plain",
  disabled,
}: DownloadButtonProps) {
  const [downloaded, setDownloaded] = useState(false);

  const handleClick = (): void => {
    const ok = downloadText(datedFilename(baseName, extension), text, mime);
    setDownloaded(ok);
    if (ok) setTimeout(() => setDownloaded(false), 1500);
  };

  return (
    <Button onClick={handleClick} disabled={disabled ?? text === ""}>
      {downloaded ? "Terunduh" : "Unduh"}
    </Button>
  );
}
