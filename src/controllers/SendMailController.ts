import { getCustomRepository } from 'typeorm';
import { resolve } from 'path'
import { Request, Response } from 'express';
import { UsersRepository } from '../repositories/UsersRepository';
import { SurveyRepository } from '../repositories/SurveysRepository';
import { SurveyUsersRepository } from '../repositories/SurveysUsersRepository';
import SendMailService from '../services/SendMailService';
import { AppError } from '../errors/AppError';

class SendMailController {
    async execute(request: Request, response: Response) {
        const { email, survey_id } = request.body;

        const usersRepository = getCustomRepository(UsersRepository);
        const surveyRepository = getCustomRepository(SurveyRepository);
        const surveysUserRepository = getCustomRepository(SurveyUsersRepository);

        const user = await usersRepository.findOne({ email });

        if (!user) {
            throw new AppError("User does not exists")       
        }

        const survey = await surveyRepository.findOne({ id: survey_id });

        if (!survey) {
            throw new AppError("Survey does not exists!") 
        }


        const npsPath = resolve(__dirname, "..", "views", "emails", "npsMail.hbs");

        const surveyuserAlreadyExists = await surveysUserRepository.findOne({
            where: { user_id: user.id, value: null },
            relations: ["user", "survey"],
        });

        const variables = {
            name: user.name,
            title: survey.title,
            description: survey.description,
            id: "",
            link: process.env.URL_MAIL
        }


        if (surveyuserAlreadyExists) {
            variables.id = surveyuserAlreadyExists.id
            await SendMailService.execute(email, survey.title, variables, npsPath)
            return response.json(surveyuserAlreadyExists)
        }

        const surveyUser = surveysUserRepository.create({
            user_id: user.id,
            survey_id
        });

        await surveysUserRepository.save(surveyUser);

        variables.id = surveyUser.id;
        await SendMailService.execute(email, survey.title, variables, npsPath);

        return response.json(surveyUser)

    }
}

export { SendMailController }