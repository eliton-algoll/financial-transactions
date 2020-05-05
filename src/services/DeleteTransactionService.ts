import { getCustomRepository } from 'typeorm';
import AppError from '../errors/AppError';

import TransactionsRepository from '../repositories/TransactionsRepository';

class DeleteTransactionService {
  public async execute(id: string): Promise<void> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);

    const transaction = await transactionsRepository.findOne(id);

    if (!transaction) {
      throw new AppError('Transaction not found', 404);
    }

    try {
      await transactionsRepository.remove(transaction);
    } catch (err) {
      throw new AppError('Transaction note deleted');
    }
  }
}

export default DeleteTransactionService;
