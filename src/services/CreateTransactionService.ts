import { getCustomRepository, getRepository } from 'typeorm';
import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    type,
    value,
    category,
  }: Request): Promise<Transaction> {
    const transactionsRepository = getCustomRepository(TransactionsRepository);
    const categoryRepository = getRepository(Category);

    const { total } = await transactionsRepository.getBalance();

    if (type === 'outcome' && total < value) {
      throw new AppError('Não possui saldo suficiente');
    }

    const categoryExists = await categoryRepository.findOne({
      where: {
        title: category,
      },
    });

    let categoryId;

    if (!categoryExists) {
      const newCategory = categoryRepository.create({
        title: category,
      });

      await categoryRepository.save(newCategory);

      categoryId = newCategory.id;
    }

    const transaction = transactionsRepository.create({
      title,
      type,
      value,
      category_id: categoryExists ? categoryExists.id : categoryId,
    });

    await transactionsRepository.save(transaction);

    return transaction;
  }
}

export default CreateTransactionService;
