import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { Basic } from '../target/types/basic'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'

describe('basic', () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env())

  const program = anchor.workspace.Basic as Program<Basic>

  it('Initialize the Lottery', async () => {
    // Add your test here.
    let name = "Paisaa_hi_paisaa";
    let organizer = anchor.web3.Keypair.generate();

    // Fund the organizer account
    const airdropSignature = await anchor.getProvider().connection.requestAirdrop(
      organizer.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await anchor.getProvider().connection.confirmTransaction(airdropSignature);

    let ticketPrice = new anchor.BN(LAMPORTS_PER_SOL/10000);
    let maxParticipant = new anchor.BN(10);

    // Generate the lottery PDA (needed for vault state PDA)
    const [lotteryPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("lottery"), Buffer.from(name), organizer.publicKey.toBytes()],
      program.programId  // Use program.programId, not SystemProgram
    )

    // Generate the vault state PDA 
    const [vaultStatePda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), lotteryPda.toBytes()],  // Seeds: ["vault", lottery_pubkey]
      program.programId  // Use program.programId, not SystemProgram
    )

    // Generate the reward vault PDA (depends on vault state)
    const [rewardVaultPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), vaultStatePda.toBytes(), lotteryPda.toBytes()],
      program.programId
    )

    try {
      const tx = await program.methods.initializeLottery(name, organizer.publicKey, ticketPrice, maxParticipant)
      .accounts({
        organizer: organizer.publicKey,
      })
      .signers([organizer])
      .rpc()
      console.log('Your transaction signature', tx)
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }

    console.log("Lottery PDA:", lotteryPda.toString());
    console.log("VaultState PDA:", vaultStatePda.toString());
    console.log("RewardVault PDA:", rewardVaultPda.toString());

    // Fetch the VaultState account data
    const vaultStateAccount = await program.account.vaultState.fetch(vaultStatePda);
    console.log("VaultState Data:", {
      stateBump: vaultStateAccount.stateBump,
      vaultBump: vaultStateAccount.vaultBump
    });

    // Fetch the Lottery account data
    const lotteryAccount = await program.account.lottery.fetch(lotteryPda);
    console.log("Lottery Data:", {
      name: lotteryAccount.name,
      organizer: lotteryAccount.organizer.toString(),
      ticketPrice: lotteryAccount.ticketPrice.toString(),
      maxParticipants: lotteryAccount.maxParticipants.toString(),
      isActive: lotteryAccount.isActive
    });

    // The RewardVault is empty (no data fields), but we can check if it exists
    try {
      const rewardVaultAccount = await program.account.rewardVault.fetch(rewardVaultPda);
      console.log("RewardVault exists and is initialized");
    } catch (error) {
      console.log("RewardVault fetch error:", error.message);
    }

  })
})
