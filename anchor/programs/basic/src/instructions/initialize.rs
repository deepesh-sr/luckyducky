use anchor_lang::prelude::*;

use crate::state::Lottery;

pub fn initialize(ctx:Context<Initialize>,name:String,organizer: Pubkey, ticket_price : u8, max_participant : u8)->Result<()>{
    let lottery = &mut ctx.accounts.lottery;

    lottery.set_inner(Lottery {name, organizer, ticket_price, max_participant, is_active:true });

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
    pub system_program : Program<'info, System>
}

