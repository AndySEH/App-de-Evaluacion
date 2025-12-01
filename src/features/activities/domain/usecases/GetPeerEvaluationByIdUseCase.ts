import { PeerEvaluation } from "../entities/PeerEvaluation";
import { PeerEvaluationRepository } from "../repositories/PeerEvaluationRepository";

export class GetPeerEvaluationByIdUseCase {
  constructor(private repository: PeerEvaluationRepository) {}

  async execute(id: string): Promise<PeerEvaluation | undefined> {
    return this.repository.getPeerEvaluationById(id);
  }
}
