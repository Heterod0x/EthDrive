import { Button, createFrames } from "frames.js/next";

const frames = createFrames({
  basePath: "/",
});

const handleRequest = frames(async () => {
  return {
    image: "https://super-eth-drive.vercel.app/logo.png",
    buttons: [
      <Button
        key="1"
        action="tx"
        target={{
          pathname: `/frames/txdata`,
          query: { tokenId: "0x1234" },
        }}
        post_url={`/frames`}
      >
        Create
      </Button>,
    ],
    textInput: "chain/path",
    imageOptions: {
      aspectRatio: "1:1",
      width: 256,
      height: 256,
    },
  };
});

export const GET = handleRequest;
export const POST = handleRequest;
