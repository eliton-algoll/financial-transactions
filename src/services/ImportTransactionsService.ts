import { getCustomRepository, In, getRepository } from 'typeorm';
import csvParse from 'csv-parse';
import fs from 'fs';

import Transaction from '../models/Transaction';
import Category from '../models/Category';
import TransactionsRepository from '../repositories/TransactionsRepository';

interface TransactionCsv {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute(filenamePath: string): Promise<Transaction[]> {
    const transactionRepository = getCustomRepository(TransactionsRepository);
    const categoryRepository = getRepository(Category);

    const readCSVStream = fs.createReadStream(filenamePath);

    const parseStream = csvParse({
      from_line: 2,
      ltrim: true,
      rtrim: true,
    });

    const parseCSV = readCSVStream.pipe(parseStream);

    const categories: string[] = [];
    const transactions: TransactionCsv[] = [];

    parseCSV.on('data', async line => {
      const [title, type, value, category] = line.map((lin: string) => {
        return lin;
      });

      if (!title || !type || !value) return;

      categories.push(category);

      transactions.push({ title, type, value, category });
    });

    await new Promise(resolve => parseCSV.on('end', resolve));

    const categoriesExist = await categoryRepository.find({
      where: {
        title: In(categories),
      },
    });

    const addCategories = categories
      .filter(category => !categoriesExist.find(cat => cat.title !== category))
      .filter((value, index, self) => self.indexOf(value) === index);

    const categoriesPersist = await categoryRepository.create(
      addCategories.map(title => ({ title })),
    );

    await categoryRepository.save(categoriesPersist);

    const allCategories = [...categoriesPersist, ...categoriesExist];

    const finalTransactions = await transactionRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: allCategories.find(
          category => category.title === transaction.category,
        ),
      })),
    );

    await transactionRepository.save(finalTransactions);

    // removendo arquivo csv
    fs.promises.unlink(filenamePath);

    return finalTransactions;
  }
}

export default ImportTransactionsService;
