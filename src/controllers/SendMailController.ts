import { getCustomRepository } from 'typeorm';
import { resolve } from 'path'
import { Request, Response } from 'express';
import { UsersRepository } from '../repositories/UsersRepository';
import { SurveyRepository } from '../repositories/SurveysRepository';
import { SurveyUsersRepository } from '../repositories/SurveysUsersRepository';
import SendMailService from '../services/SendMailService';

class SendMailController {
    async execute(request: Request, response: Response) {
        const { email, survey_id } = request.body;

        const usersRepository = getCustomRepository(UsersRepository);
        const surveyRepository = getCustomRepository(SurveyRepository);
        const surveysUserRepository = getCustomRepository(SurveyUsersRepository);

        const userAlreadyExists = await usersRepository.findOne({ email });

        if (!userAlreadyExists) {
            return response.status(400).json({ error: "User does not exists" });
        }

        const survey = await surveyRepository.findOne({ id: survey_id });

        if (!survey) {
            return response.status(400).json({
                error:"Survey does not exists!"
            });
        }

        const variables = {
            name: userAlreadyExists.name,
            title: survey.title,
            description: survey.description,
            user_id: userAlreadyExists.id,
            link:process.env.URL_MAIL
        }

        const npsPath = resolve(__dirname, "..", "views", "emails", "npsMail.hbs");

        const surveyUserAlreadyExists = await surveyRepository.findOne({
            where: [{userAlreadyExists_id: userAlreadyExists.id},{value: null}],
            relations: ["user", "survey"]
        });

        if(surveyUserAlreadyExists) {
            await SendMailService.execute(email, survey.title,variables,  npsPath)
            return response.json(surveyUserAlreadyExists)
        } 

        const surveyUser = surveysUserRepository.create({
            user_id: userAlreadyExists.id,
            survey_id
        });

        await surveysUserRepository.save(surveyUser);

       

     

        await SendMailService.execute(email, survey.title, variables, npsPath);

        return response.json(surveyUser)

    }
}

export { SendMailController }