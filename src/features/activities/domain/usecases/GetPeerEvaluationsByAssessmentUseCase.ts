import { PeerEvaluation } from "../entities/PeerEvaluation";
import { PeerEvaluationRepository } from "../repositories/PeerEvaluationRepository";

export class GetPeerEvaluationsByAssessmentUseCase {
  constructor(private repository: PeerEvaluationRepository) {}

  async execute(assessmentId: string): Promise<PeerEvaluation[]> {
    return this.repository.getPeerEvaluationsByAssessment(assessmentId);
  }
}
