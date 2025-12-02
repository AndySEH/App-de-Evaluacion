export interface PeerEvaluation {
  _id?: string;
  id?: string;
  assessmentId: string;
  evaluatorId: string;
  evaluateeId: string;
  punctuality: number; // Integer 1-5
  contributions: number; // Integer 1-5
  commitment: number; // Integer 1-5
  attitude: number; // Integer 1-5
}

export type NewPeerEvaluation = Omit<PeerEvaluation, "_id">;
