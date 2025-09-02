use anchor_lang::prelude::*;

pub mod state;
pub mod instructions;
pub mod error;

use instructions::*;

declare_id!("JAVuBXeBZqXNtS73azhBDAoYaaAFfo4gWXoZe2e7Jf8H");

#[program]
pub mod basic {
    use crate::instructions::Initialize;

    use super::*;
    
    pub fn initialize_lottery(ctx: Context<Initialize>,name : String,organizer: Pubkey, ticket_price : u64, max_participant : u64) -> Result<()> {
        initialize(ctx,name, organizer, ticket_price, max_participant)
    }
}
