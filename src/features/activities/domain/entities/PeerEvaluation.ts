export interface PeerEvaluation {
  _id?: string;
  id?: string;
  assessmentId: string;
  evaluatorId: string;
  evaluateeId: string;
  punctuality: number;
  contributions: number;
  commitment: number;
  attitude: number;
}

export type NewPeerEvaluation = Omit<PeerEvaluation, "_id">;
