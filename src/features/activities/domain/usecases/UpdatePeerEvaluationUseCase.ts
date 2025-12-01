import { PeerEvaluation } from "../entities/PeerEvaluation";
import { PeerEvaluationRepository } from "../repositories/PeerEvaluationRepository";

export class UpdatePeerEvaluationUseCase {
  constructor(private repository: PeerEvaluationRepository) {}

  async execute(id: string, updates: Partial<PeerEvaluation>): Promise<void> {
    return this.repository.updatePeerEvaluation(id, updates);
  }
}
