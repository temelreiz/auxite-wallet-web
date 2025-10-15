export const TOKENS = {
  AUXG: process.env.NEXT_PUBLIC_AUXG_ADDR!,
  AUXS: process.env.NEXT_PUBLIC_AUXS_ADDR!,
  AUXPT: process.env.NEXT_PUBLIC_AUXPT_ADDR!,
  AUXPD: process.env.NEXT_PUBLIC_AUXPD_ADDR!,
} as const;

export const ERC20_ABI = [
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
  "function allowance(address,address) view returns(uint256)",
  "function approve(address,uint256) returns (bool)",
] as const;
