'use strict';
var nodeMailer = require('nodemailer'),
    smtpTransport = require('nodemailer-smtp-transport'),
    config = require('../../res/config.js'),
    emailTemplates = require('email-templates'),
    path = require('path'),
    templatesDir = path.resolve('app/components/mailer/');

var defaultTransport,
    EmailAddressRequiredError = new Error('email address required');

function init() {
    switch (config.env) {
        case 'production':
            defaultTransport = nodeMailer.createTransport(smtpTransport('smtps://' + config.mailer.auth.user + '%40bq.com:' + config.mailer.auth.pass + '@smtp.gmail.com'));
            break;
        default:
            defaultTransport = nodeMailer.createTransport('smtps://' + config.mailer.auth.user + '%40gmail.com:' + config.mailer.auth.pass + '@smtp.gmail.com');
    }
}

exports.sendMail = function(to, from, subject, html, callback) {
    init();
    callback();
    defaultTransport.sendMail({
            to: to,
            from: config.mailer.defaultFromAddress,
            bcc: locals.emailTObbc || '',
            subject: subject,
            html: html
        },
        callback
    );
};

exports.sendOne = function(templateName, locals, fn) {
    init();
    // make sure that we have an user email
    if (!locals.email) {
        return fn(EmailAddressRequiredError);
    }
    // make sure that we have a message
    if (!locals.subject) {
        return fn(EmailAddressRequiredError);
    }
    emailTemplates(templatesDir, function(err, template) {
        if (err) {
            return fn(err);
        }
        // Send a single email
        template(templateName, locals, function(err, html, text) {
            if (err) {
                return fn(err);
            }

            defaultTransport.sendMail({
                from: config.mailer.defaultFromAddress,
                to: locals.email,
                bcc: locals.emailTObbc || '',
                subject: locals.subject,
                html: html,
                generateTextFromHTML: true,
                text: text
            }, function(err, responseStatus) {
                if (err) {
                    return fn(err);
                }
                return fn(null, responseStatus.message, html, text);
            });
        });
    });
};
