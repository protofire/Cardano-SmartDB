import React from 'react';
import { Store as StoreNotifications } from 'react-notifications-component';

//---------------------------------------------------------------

const messageComponent = (message: string) => <div dangerouslySetInnerHTML={{ __html: message }} />;

export function pushSucessNotification(title: string, mesagge: string, swHash = true) {
    let messageForNotification;

    if (swHash) {
        messageForNotification = 'Ok! TxHash: ' + mesagge;
    } else {
        messageForNotification = 'Ok! ' + mesagge;
    }

    StoreNotifications.addNotification({
        title: `${title}`,
        message: messageComponent(`${messageForNotification}`),
        type: 'success',
        insert: 'bottom',
        container: 'bottom-right',
        animationIn: ['animate__animated', 'animate__fadeIn'],
        animationOut: ['animate__animated', 'animate__fadeOut'],
        width: 400,
        dismiss: {
            duration: 3000,
            onScreen: true,
            pauseOnHover: true,
        },
    });
}
//---------------------------------------------------------------

export function pushWarningNotification(title: string, error: any) {
    StoreNotifications.addNotification({
        title: `${title}`,
        message: messageComponent(`${error?.info || error?.message || error || ''}`),
        type: 'warning',
        insert: 'bottom',
        container: 'bottom-right',
        animationIn: ['animate__animated', 'animate__fadeIn'],
        animationOut: ['animate__animated', 'animate__fadeOut'],
        width: 400,
        dismiss: {
            duration: 3000,
            onScreen: true,
            pauseOnHover: true,
        },
    });
}
