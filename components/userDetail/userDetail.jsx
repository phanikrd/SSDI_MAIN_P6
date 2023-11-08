import React from 'react';
import {
  TextField,
  Button
} from '@mui/material';
import './userDetail.css';
import { Link } from 'react-router-dom';

import axios from 'axios'; 

/**
 * Define UserDetail, a React component of project #5
 */
class UserDetail extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      userDetails: undefined,
    };
  }

componentDidMount() {
    const new_user_id = this.props.match.params.userId;
    this.handleUserChange(new_user_id);
}

componentDidUpdate() {
  const new_user_id = this.props.match.params.userId;
  const current_user_id = this.state.userDetails?._id;
  if (current_user_id  !== new_user_id){
      this.handleUserChange(new_user_id);
  }
}

handleUserChange(user_id){
        axios.get("/user/" + user_id)
            .then((response) =>
            {
                const new_user = response.data;
                this.setState({
                    userDetails: new_user
                });
                const main_content = "User Details for " + new_user.first_name + " " + new_user.last_name;
                this.props.changeTopbarContent(main_content);
            });
    }
  render() {
    const { userDetails } = this.state;
    return userDetails ? (
      <div>
        <Button
          variant="contained"
          size="medium"
          component={Link}
          to={`/photos/${userDetails._id}`}
          className="button"
        >
            USER PHOTOS
        </Button>
        <TextField
          disabled
          fullWidth
          id="outlined-disabled"
          label="First Name"
          className="custom-field"
          value={userDetails.first_name}
        />
        <TextField
          disabled
          fullWidth
          id="outlined-disabled"
          label="Last Name"
          className="custom-field"
          value={userDetails.last_name}
        />
        <TextField
          disabled
          fullWidth
          id="outlined-disabled"
          label="Location"
          className="custom-field"
          value={userDetails.location}
        />
        <TextField
          disabled
          fullWidth
          id="outlined-disabled"
          label="Description"
          multiline
          rows={5}
          className="custom-field"
          value={userDetails.description}
        />
        <TextField
          disabled
          fullWidth
          id="outlined-disabled"
          label="Occupation"
          className="custom-field"
          value={userDetails.occupation}
        />
      </div>
    ) : (
      <div />
    );
  }
}

export default UserDetail;
