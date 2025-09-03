import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { Basic } from '../target/types/basic'
import { LAMPORTS_PER_SOL } from '@solana/web3.js'
import { error } from 'console'

describe('basic', () => {
  // Configure the client to use the local cluster.
  anchor.setProvider(anchor.AnchorProvider.env())

  const program = anchor.workspace.Basic as Program<Basic>
  let organizer = anchor.web3.Keypair.generate();
  let raffleName = "Paisaa_hi_paisaa";
  const participant = anchor.web3.Keypair.generate();

  // Generate the lottery PDA (needed for vault state PDA)
  const [lotteryPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("lottery"), Buffer.from(raffleName), organizer.publicKey.toBytes()],
    program.programId  // Use program.programId
  )

  // Generate the vault state PDA 
  const [vaultStatePda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), lotteryPda.toBytes()],  // Seeds: ["vault", lottery_pubkey]
    program.programId  // Use program.programId
  )

  // Generate the reward vault PDA (depends on vault state)
  const [rewardVaultPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), vaultStatePda.toBytes(), lotteryPda.toBytes()],
    program.programId
  )

  const [participantTicket] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("participant"), lotteryPda.toBytes()],
    program.programId
  )

  it('Initialize the Lottery', async () => {
    // Add your test here.

    // Fund the organizer account
    const airdropSignature = await anchor.getProvider().connection.requestAirdrop(
      organizer.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await anchor.getProvider().connection.confirmTransaction(airdropSignature);

    let ticketPrice = new anchor.BN(LAMPORTS_PER_SOL / 10000);
    let maxParticipant = new anchor.BN(10);


    try {
      const tx = await program.methods.initializeLottery(raffleName, organizer.publicKey, ticketPrice, maxParticipant)
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
    console.log("Organizer", organizer.publicKey.toString())
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

      // Check the lamports balance of the reward vault PDA
      const rewardVaultBalance = await anchor.getProvider().connection.getBalance(rewardVaultPda);
      console.log("RewardVault Balance (lamports):", rewardVaultBalance);
      console.log("RewardVault Balance (SOL):", rewardVaultBalance / LAMPORTS_PER_SOL);
    } catch (error) {
      console.log("RewardVault fetch error:", error.message);
    }

  })
  it('Participate in Raffle', async () => {

    const airdropSignature = await anchor.getProvider().connection.requestAirdrop(
      participant.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await anchor.getProvider().connection.confirmTransaction(airdropSignature);

    try {
      const tx = await program.methods.participate()
        .accountsStrict({
          lottery: lotteryPda,
          participant: participant.publicKey,
          participantTicket: participantTicket,
          rewardVault: rewardVaultPda,
          systemProgram: anchor.web3.SystemProgram.programId,
          vaultState: vaultStatePda
        })
        .signers([participant]).rpc();
      console.log(tx)
    } catch (error) {
      console.error(error.message)
    }


    const vaultStateAccount = await program.account.vaultState.fetch(vaultStatePda);
    console.log("VaultState Data:", {
      stateBump: vaultStateAccount.stateBump,
      vaultBump: vaultStateAccount.vaultBump
    });

    const participantTicketAccount = await program.account.participantTicket.fetch(participantTicket);
    console.log("ParticipantTicket Data:", {
      lottery: participantTicketAccount.lottery.toString(),
      participantPubkey: participantTicketAccount.participantPubkey.toString()
    });

    // Check reward vault balance AFTER participation
    const rewardVaultBalance = await anchor.getProvider().connection.getBalance(rewardVaultPda);
    console.log("RewardVault Balance AFTER Participation:");
    console.log("- Lamports:", rewardVaultBalance);
    console.log("- SOL:", rewardVaultBalance / LAMPORTS_PER_SOL);

    // Get account info for more details
    const rewardVaultAccountInfo = await anchor.getProvider().connection.getAccountInfo(rewardVaultPda);
    console.log("RewardVault Account Info:", {
      lamports: rewardVaultAccountInfo?.lamports,
      owner: rewardVaultAccountInfo?.owner.toString(),
      executable: rewardVaultAccountInfo?.executable,
      rentEpoch: rewardVaultAccountInfo?.rentEpoch
    });

    const rewardVaultAccount = await program.account.rewardVault.fetch(rewardVaultPda);

  })
  it('Distribute Prize', async () => {
    try {
      const tx = await program.methods.distributePrize()
        .accountsStrict(
          {
            lottery: lotteryPda,
            participant: participant.publicKey,
            organizer : organizer.publicKey,
            participantTicket : participantTicket,
            rewardVault : rewardVaultPda,
            vaultState : vaultStatePda,
            systemProgram : anchor.web3.SystemProgram.programId
          }).signers([organizer]).rpc();
    } catch (e) {
      console.error(e.message)
    }
  })
})
