use anchor_lang::prelude::*;

use crate::state::{Lottery, RewardVault, VaultState};

pub fn initialize(ctx:Context<Initialize>,name:String,organizer: Pubkey, ticket_price : u64, max_participants : u64)->Result<()>{
    let lottery = &mut ctx.accounts.lottery;

    lottery.set_inner(Lottery {name, organizer, ticket_price, max_participants, is_active:true });

    let vault_state = &mut ctx.accounts.vault_state;
    
    vault_state.set_inner(VaultState { state_bump: ctx.bumps.vault_state, vault_bump: ctx.bumps.reward_vault });
    Ok(())
}

#[derive(Accounts)]
#[instruction(name : String)]
pub struct Initialize<'info>{
    #[account(mut)]
    pub organizer : Signer<'info>,

    #[account(
        init,
        payer = organizer,
        space = 8 + Lottery::INIT_SPACE,
        seeds = [b"lottery", name.as_bytes(), organizer.key().as_ref()],
        bump
    )]
    pub lottery : Account<'info,Lottery>,

    #[account(
        init,
        payer = organizer,
        space = 8 + VaultState::INIT_SPACE,
        seeds = [b"vault",lottery.key().as_ref()],
        bump 
    )]
    pub vault_state : Account<'info,VaultState>,

    #[account(
        init,
        payer = organizer,
        space = 8, 
        seeds = [b"vault",vault_state.key().as_ref(),lottery.key().as_ref()],
        bump
    )]
    pub reward_vault : Account<'info,RewardVault>,
    pub system_program : Program<'info, System>
}


