import React, { useState } from 'react';
import { Badge, Button, Offcanvas } from 'react-bootstrap';
import { useNotifications } from '../context/NotificationContext';
import { BsBell } from 'react-icons/bs';

const NotificationCenter = () => {
  const [show, setShow] = useState(false);
  const { notifications = [], unreadCount = 0, markAllAsRead, clearNotifications } = useNotifications();

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  return (
    <>
      <Button 
        variant="link" 
        className="position-relative"
        onClick={handleShow}
      >
        <BsBell size={20} color="white" />
        {unreadCount > 0 && (
          <Badge 
            bg="danger" 
            className="position-absolute top-0 start-100 translate-middle rounded-pill"
          >
            {unreadCount}
          </Badge>
        )}
      </Button>

      <Offcanvas show={show} onHide={handleClose} placement="end">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Notifications</Offcanvas.Title>
          <div>
            <Button variant="link" onClick={markAllAsRead}>Mark all as read</Button>
            <Button variant="link" onClick={clearNotifications}>Clear all</Button>
          </div>
        </Offcanvas.Header>
        <Offcanvas.Body>
          {!notifications || notifications.length === 0 ? (
            <p className="text-muted text-center">No notifications</p>
          ) : (
            <div className="d-flex flex-column gap-2">
              {notifications.map((notification, index) => (
                <div 
                  key={index}
                  className={`p-3 border rounded ${notification.read ? 'bg-light' : 'bg-white'}`}
                >
                  <h6>{notification.title}</h6>
                  <p className="mb-1">{notification.message}</p>
                  <small className="text-muted">
                    {new Date(notification.timestamp).toLocaleString()}
                  </small>
                </div>
              ))}
            </div>
          )}
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
};

export default NotificationCenter; 