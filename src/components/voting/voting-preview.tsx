"use client";

import { VotingStatus } from "./voting-status";

export function VotingPreview() {
  return (
    <VotingStatus
      activeRound={null}
      hasVoted={false}
      candidates={[]}
      isEmployee={true}
    />
  );
}
