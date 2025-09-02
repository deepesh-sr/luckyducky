use anchor_lang::prelude::*;

#[derive(Accounts)]

pub struct Participate<'info>{

    #[account(
        mut
    )]
    pub participant : Account<'info,SystemAccount>,

    #[account(
        init,
        payer = 
    )]
    pub participant 
} 