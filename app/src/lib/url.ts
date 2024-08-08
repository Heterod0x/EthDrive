export const baseUrl =
  process.env.NODE_ENV == "production"
    ? "https://super-eth-drive.vercel.app"
    : "http://localhost:3000";
