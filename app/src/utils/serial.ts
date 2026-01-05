import { Transport } from "esptool-js";
export const sleep = (time: number) =>
  new Promise((resolve) => setTimeout(resolve, time));

export const hardResetTransport = async (transport: Transport) => {
  console.log("Triggering reset");
  // Type assertion to access the method
  await (transport.device as any).setSignals({
    dataTerminalReady: false,
    requestToSend: true,
  });
  await sleep(250);
  await (transport.device as any).setSignals({
    dataTerminalReady: false,
    requestToSend: false,
  });
  await sleep(250);
  await new Promise((resolve) => setTimeout(resolve, 1000));
};
