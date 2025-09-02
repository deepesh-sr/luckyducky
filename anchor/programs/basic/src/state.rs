use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Lottery {
    #[max_len(30)]
    pub name : String,
    pub organizer : Pubkey,
    pub ticket_price : u64,
    pub max_participants: u64,
    pub is_active : bool
}

#[account]
#[derive(InitSpace)]
pub struct VaultState{
    pub state_bump : u8,
    pub vault_bump : u8
}

#[account]
pub struct RewardVault{}

#[account]
#[derive(InitSpace)]
pub struct ParticipantTicket{
    pub lottery : Pubkey,
    pub participant_pubkey : Pubkey,
}