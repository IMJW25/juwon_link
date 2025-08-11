// dapp.js (ESM)
import { ethers } from 'https://cdn.jsdelivr.net/npm/ethers@5.7.2/dist/ethers.esm.min.js';

const CONTRACT_ADDRESS = '0xYourDeployedContractAddressHere';  // 본인 스마트컨트랙트 주소로 변경
const ABI = [
  'event LinkShared(address indexed user, string link, uint256 timestamp)',
  'event LinkClicked(address indexed user, string link, uint256 timestamp)',
  'function shareLink(string link) external',
  'function recordClick(string link) external'
];

let provider, signer, contract;

// 지갑 연결
export async function connectWallet() {
  if (!window.ethereum) throw new Error('MetaMask가 설치되어 있지 않습니다.');
  provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send('eth_requestAccounts', []);
  signer = provider.getSigner();
  contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);
  return signer.getAddress();
}

// 링크 공유 온체인 기록
export async function sendLinkOnChain(link) {
  if (!contract) await connectWallet();
  const tx = await contract.shareLink(link);
  await tx.wait();
}

// 링크 클릭 온체인 기록
export async function sendOnChainClick(link) {
  if (!contract) await connectWallet();
  const tx = await contract.recordClick(link);
  await tx.wait();
}
