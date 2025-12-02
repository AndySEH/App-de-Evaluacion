import { NewPeerEvaluation, PeerEvaluation } from "../entities/PeerEvaluation";

export interface PeerEvaluationRepository {
  getPeerEvaluationsByAssessment(assessmentId: string): Promise<PeerEvaluation[]>;
  getPeerEvaluationById(id: string): Promise<PeerEvaluation | undefined>;
  addPeerEvaluation(peerEvaluation: NewPeerEvaluation): Promise<void>;
  updatePeerEvaluation(id: string, updates: Partial<PeerEvaluation>): Promise<void>;
  deletePeerEvaluation(id: string): Promise<void>;
}
