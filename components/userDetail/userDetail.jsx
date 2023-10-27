import React, { Component } from 'react';
import { Typography, Button } from '@mui/material';
import './userDetail.css';
import { Link } from "react-router-dom";
import axios from 'axios';

class UserDetail extends Component {
    constructor(props) {
        super(props);
        this.state = {
            user: null,
        };
    }

    componentDidMount() {
        const { match } = this.props;
        const userId = match.params.userId;

        // Fetch user details using Axios
        axios.get(`/user/${userId}`)
            .then((response) => {
                const user = response.data;
                this.setState({ user });
            })
            .catch((error) => {
                console.error('Error fetching user data:', error);
            });
    }

    handleViewPhotosClick = () => {
        const { history, match } = this.props;
        const userId = match.params.userId;
        history.push(`/photos/${userId}`);
    };

    render() {
        const { user } = this.state;

        return (
            <div className="user-detail-container">
                <Typography variant='h2'>User Details</Typography>
                {user && (
                    <>
                        <Typography variant='body1'>Name: {`${user.first_name} ${user.last_name}`}</Typography>
                        <Typography variant='body1'>Location: {user.location}</Typography>
                        <Typography variant='body1'>Description: {user.description}</Typography>
                        <Typography variant='body1'>Occupation: {user.occupation}</Typography>
                        <Button variant="contained" color="primary" onClick={this.handleViewPhotosClick}>
                            View Photos
                        </Button>
                    </>
                )}
            </div>
        );
    }
}

export default UserDetail;
