use anchor_lang::{prelude::*, solana_program::lamports, system_program::{transfer, Transfer}};

use crate::state::{Lottery, ParticipantTicket, VaultState, RewardVault};

pub fn distribute_prize(ctx :Context<Distribute>)-> Result<()>{
let vault_state_bump = &ctx.accounts.vault_state.vault_bump;
let lamports = ctx.accounts.reward_vault.get_lamports();
let seeds = &[
    "vault".as_bytes(),
    ctx.accounts.vault_state.to_account_info().key.as_ref(),
    ctx.accounts.lottery.to_account_info().key.as_ref(),
    &[*vault_state_bump]
];
let signer_seeds = &[&seeds[..]];
let cpi_ctx = CpiContext::new_with_signer(ctx.accounts.system_program.to_account_info(), 
Transfer{
    from : ctx.accounts.reward_vault.to_account_info(),
    to : ctx.accounts.participant.to_account_info()
},signer_seeds);

transfer(cpi_ctx, lamports);
Ok(())
}

#[derive(Accounts)]
pub struct Distribute<'info>{
    #[account(mut)]
    pub organizer : Signer<'info>,

    #[account(
        seeds = [b"participant",lottery.key().as_ref()],
        bump
    )]
    pub participant_ticket : Account<'info,ParticipantTicket>,

    #[account(mut)]
    pub participant : SystemAccount<'info>,

    #[account()]
    pub lottery : Account<'info,Lottery>,

    #[account(
    seeds = [b"vault",lottery.key().as_ref()],
    bump = vault_state.state_bump
    )]
    pub vault_state : Account<'info,VaultState>,

    #[account(
        mut,
        seeds = [b"vault",vault_state.key().as_ref(),lottery.key().as_ref()],
        bump = vault_state.vault_bump
    )]
    pub reward_vault : Account<'info,RewardVault>,
   
    pub system_program : Program<'info,System>

}