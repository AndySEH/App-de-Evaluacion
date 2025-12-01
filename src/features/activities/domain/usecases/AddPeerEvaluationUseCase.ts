import { NewPeerEvaluation } from "../entities/PeerEvaluation";
import { PeerEvaluationRepository } from "../repositories/PeerEvaluationRepository";

export class AddPeerEvaluationUseCase {
  constructor(private repository: PeerEvaluationRepository) {}

  async execute(peerEvaluation: NewPeerEvaluation): Promise<void> {
    return this.repository.addPeerEvaluation(peerEvaluation);
  }
}
