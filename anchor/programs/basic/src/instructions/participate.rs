use anchor_lang::{prelude::*, system_program};

use crate::{state::{Lottery, ParticipantTicket, RewardVault, VaultState}};
use crate::error::TicketRegistryError;

pub fn participate(ctx : Context<Participate>)->Result<()>{
    let lottery = &mut ctx.accounts.lottery;
    let participant = &mut ctx.accounts.participant;
    let participant_ticket = &mut ctx.accounts.participant_ticket;
    let system_program = &mut ctx.accounts.system_program;
    
    require!(
        lottery.max_participants > 0,
        TicketRegistryError::AllTicketsSoldOut
    );

    let cpi = CpiContext::new(system_program.to_account_info(), system_program::Transfer{
        from : participant.to_account_info(),
        to : ctx.accounts.reward_vault.to_account_info()
    });

    system_program::transfer(cpi, lottery.ticket_price)?;

    participant_ticket.lottery = lottery.key();
    participant_ticket.participant_pubkey = participant.key();
    
    Ok(())
}


#[derive(Accounts)]
pub struct Participate<'info>{

    #[account(
        mut
    )]
    pub participant : Signer<'info>,

    #[account(
        init,
        payer = participant,
        space = 8 + ParticipantTicket::INIT_SPACE,
        seeds = [b"participant",lottery.key().as_ref()],
        bump
    )]
    pub participant_ticket : Account<'info,ParticipantTicket>,

    #[account(mut)]
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