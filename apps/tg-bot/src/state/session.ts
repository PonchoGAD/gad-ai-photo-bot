export type Mode = "CREATE" | "ENHANCE" | "BG" | "BATCH";

export type SessionState = {
  mode?: "CREATE";
  uploadKeys: string[];
  started?: boolean;
};

export function newSession(): SessionState {
  return {
    uploadKeys: [],
    started: false
  };
}
