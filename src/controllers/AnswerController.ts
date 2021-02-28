import { getCustomRepository } from 'typeorm';
import { Request, Response } from 'express'
import { SurveyUsersRepository } from '../repositories/SurveysUsersRepository';
import { AppError } from '../errors/AppError';

class AnswerController {
    async execute(request: Request, response: Response) {
        const { value } = request.params;
        const { u } = request.query;

        const surveysUserRepository = getCustomRepository(SurveyUsersRepository)

        const surveyUser = await surveysUserRepository.findOne({
            id: String(u),

        })
        if (!surveyUser) {
            throw new AppError("Survey user does not exists!");
        }

        surveyUser.value = Number(value);
        await surveysUserRepository.save(surveyUser);

        return response.json(surveyUser)
    }
}

export { AnswerController }